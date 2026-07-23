/**
 * BETESEB ADMIN — Verification Management API
 * POST /api/admin/verification
 * 
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS and:
 * 1. Update verification status (verified/rejected)
 * 2. Update the user's profile is_verified and verification_status fields
 * 3. Send an SMS notification to the user
 * 
 * Body: {
 *   id: string,          // verifications.id
 *   userId: string,      // profiles.id (user_id on verifications)
 *   status: 'verified' | 'rejected',
 *   reason?: string      // rejection reason (only for rejected)
 * }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side admin client — bypasses all RLS policies
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, userId, status, reason } = await req.json();

    if (!id || !userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, userId, status' },
        { status: 400 }
      );
    }

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be verified or rejected.' },
        { status: 400 }
      );
    }

    // ── 1. Fetch current id_data (needed for rejection reason merge) ──────────
    let idDataUpdate: Record<string, any> | undefined;
    if (status === 'rejected' && reason) {
      const { data: currentReq } = await supabaseAdmin
        .from('verifications')
        .select('id_data')
        .eq('id', id)
        .single();
      idDataUpdate = {
        ...(currentReq?.id_data || {}),
        rejection_reason: reason
      };
    }

    // ── 2. Update verifications table ─────────────────────────────────────────
    const verificationUpdate: Record<string, any> = {
      status,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
    };
    if (idDataUpdate) {
      verificationUpdate.id_data = idDataUpdate;
    }

    const { error: verError } = await supabaseAdmin
      .from('verifications')
      .update(verificationUpdate)
      .eq('id', id);

    if (verError) {
      console.error('[Admin Verify] Failed to update verification:', verError);
      return NextResponse.json({ error: verError.message }, { status: 500 });
    }

    // ── 3. Update profiles table ──────────────────────────────────────────────
    const profileUpdate: Record<string, any> =
      status === 'verified'
        ? { is_verified: true, verification_status: 'verified' }
        : { is_verified: false, verification_status: 'rejected' };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (profileError) {
      console.error('[Admin Verify] Failed to update profile:', profileError);
      // Non-fatal — still return success since verification was updated
    }

    // ── 3b. Trigger Automated Reward Evaluation (Gold Tier) ────────────────────
    if (status === 'verified') {
      try {
        await supabaseAdmin.rpc('evaluate_and_award_user_rewards', {
          p_user_id: userId
        });
      } catch (rewardErr) {
        console.error('[Admin Verify] Automated reward evaluation error:', rewardErr);
      }
    }

    // ── 4. Fetch user phone for SMS (optional, non-fatal) ─────────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('phone, full_name')
      .eq('id', userId)
      .single();

    if (profile?.phone) {
      const smsMessage =
        status === 'verified'
          ? `ሰላም ${profile.full_name || ''}! የእርስዎ Beteseb አካውንት ማንነት ማረጋገጥ ጸድቋል። ✅ አሁን ሙሉ አቅሜዎን ይጠቀሙ።`
          : `ሰላም ${profile.full_name || ''}! የማንነት ማረጋገጫ ጥያቄዎ ውድቅ ተደርጓል። ምክንያት፦ ${reason || 'ያልተገለጸ ምክንያት'}። እባክዎ ዳግም ይሞክሩ።`;

      try {
        await supabaseAdmin.from('sms_queue').insert({
          phone: profile.phone,
          message: smsMessage,
          status: 'pending',
        });
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      status,
      id,
      userId,
      idData: idDataUpdate,
    });
  } catch (err: any) {
    console.error('[Admin Verify] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
