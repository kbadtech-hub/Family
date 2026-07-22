import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { evaluateReferralTriggers } from '@/lib/referral-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, requestId, disputeId, reason, proofUrl, rateEtb, refereeEmail, referrerId } = body as {
      action: 'approve_withdrawal' | 'reject_withdrawal' | 'resolve_dispute' | 'reject_dispute' | 'update_exchange_rate' | 'manual_verify_referral';
      requestId?: string;
      disputeId?: string;
      reason?: string;
      proofUrl?: string;
      rateEtb?: number;
      refereeEmail?: string;
      referrerId?: string;
    };

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // 1. Approve Withdrawal Request
    if (action === 'approve_withdrawal') {
      if (!requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 });

      const { data, error } = await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          proof_url: proofUrl || null,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Withdrawal request approved', withdrawal: data });
    }

    // 2. Reject Withdrawal Request (Refund Coins to User Wallet)
    if (action === 'reject_withdrawal') {
      if (!requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 });

      const { data: request, error: fetchErr } = await supabaseAdmin
        .from('withdrawal_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchErr || !request) return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });

      if (request.status === 'rejected') {
        return NextResponse.json({ error: 'Withdrawal request is already rejected' }, { status: 400 });
      }

      // Mark request rejected
      const { data: updatedReq, error: updateErr } = await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason || 'Rejected by Admin',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      // Refund coins back to user wallet
      const refundAmount = Number(request.coins_amount);
      await supabaseAdmin.from('coin_transactions').insert({
        user_id: request.user_id,
        amount: refundAmount,
        type: 'admin_adjustment',
        note: `Refund: Rejected Withdrawal Request (${refundAmount.toLocaleString()} Coins)`
      });

      return NextResponse.json({ success: true, message: 'Withdrawal rejected and coins refunded to user wallet', withdrawal: updatedReq });
    }

    // 3. Resolve Dispute Claim (Manual Referral Reward Fix)
    if (action === 'resolve_dispute') {
      if (!disputeId) return NextResponse.json({ error: 'disputeId is required' }, { status: 400 });

      const { data: dispute, error: fetchErr } = await supabaseAdmin
        .from('referral_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      if (fetchErr || !dispute) return NextResponse.json({ error: 'Dispute claim not found' }, { status: 404 });

      // Search for referee profile by email
      const { data: refereeProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, verification_status, is_verified')
        .eq('email', dispute.referee_email)
        .single();

      if (!refereeProfile) {
        return NextResponse.json({ error: `No registered user found with email ${dispute.referee_email}` }, { status: 400 });
      }

      // Update or insert referral record linking referee to claimant
      await supabaseAdmin
        .from('profiles')
        .update({ referred_by: dispute.user_id })
        .eq('id', refereeProfile.id);

      const { data: refRow } = await supabaseAdmin
        .from('referrals')
        .upsert({
          referrer_id: dispute.user_id,
          referee_id: refereeProfile.id,
          referral_code: 'MANUAL_CLAIM'
        })
        .select()
        .single();

      // Trigger evaluations
      await evaluateReferralTriggers(refereeProfile.id, 'gold_verification');
      await evaluateReferralTriggers(refereeProfile.id, 'first_subscription');
      await evaluateReferralTriggers(refereeProfile.id, 'mobile_app_login');

      // Update dispute status
      await supabaseAdmin
        .from('referral_disputes')
        .update({
          status: 'resolved',
          admin_notes: reason || 'Manually verified and referral rewards credited.',
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      return NextResponse.json({ success: true, message: 'Dispute resolved and referral rewards credited to user.' });
    }

    // 4. Reject Dispute Claim
    if (action === 'reject_dispute') {
      if (!disputeId) return NextResponse.json({ error: 'disputeId is required' }, { status: 400 });

      await supabaseAdmin
        .from('referral_disputes')
        .update({
          status: 'rejected',
          admin_notes: reason || 'Claim rejected after admin verification.',
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      return NextResponse.json({ success: true, message: 'Dispute claim rejected.' });
    }

    // 5. Update Dynamic Exchange Rate Config
    if (action === 'update_exchange_rate') {
      if (!rateEtb || rateEtb <= 0) return NextResponse.json({ error: 'Valid ETB rate is required' }, { status: 400 });

      const { data: settingsData } = await supabaseAdmin
        .from('settings')
        .select('*')
        .limit(1)
        .single();

      const existingCms = settingsData?.cms_content || {};
      const updatedCms = { ...existingCms, coin_exchange_rate_etb: rateEtb };

      if (settingsData) {
        await supabaseAdmin
          .from('settings')
          .update({ cms_content: updatedCms })
          .eq('id', settingsData.id);
      } else {
        await supabaseAdmin
          .from('settings')
          .insert({ cms_content: updatedCms });
      }

      return NextResponse.json({ success: true, message: `Exchange rate updated: 10,000 Coins = ${rateEtb} ETB` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
