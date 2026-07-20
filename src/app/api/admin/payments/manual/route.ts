import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Admin API Endpoint (/api/admin/payments/manual)
 * Allows admins to:
 * 1. Manually credit coins, VIP, or Premium to any user by email or ID.
 * 2. Lookup and verify any Chapa transaction reference directly from Chapa API.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'manual_credit') {
      const { emailOrId, creditType, amountOrPlan, note } = body;

      if (!emailOrId || !creditType || !amountOrPlan) {
        return NextResponse.json({ status: 'error', message: 'Missing required parameters' }, { status: 400 });
      }

      // Find user by ID or Email
      let userQuery = supabase.from('profiles').select('id, email, full_name').limit(1);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(emailOrId)) {
        userQuery = userQuery.eq('id', emailOrId);
      } else {
        userQuery = userQuery.eq('email', emailOrId.trim().toLowerCase());
      }

      const { data: profiles, error: pErr } = await userQuery;
      const targetUser = profiles?.[0];

      if (pErr || !targetUser) {
        return NextResponse.json({ status: 'error', message: `User not found for "${emailOrId}"` }, { status: 404 });
      }

      const userId = targetUser.id;

      if (creditType === 'coins') {
        const numCoins = parseInt(String(amountOrPlan)) || 50;

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: `coins_${numCoins}`,
          amount: 0,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Admin Manual Credit: ${note || 'Customer Resolution'}`,
        });

        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: numCoins,
          type: 'admin_adjustment',
          note: note || `Admin Manual Coin Credit: ${numCoins} coins`
        });

        const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();

        return NextResponse.json({
          status: 'success',
          message: `Successfully credited ${numCoins} coins to ${targetUser.full_name} (${targetUser.email}).`,
          user: targetUser,
          coinBalance: Number(wallet?.coin_balance || 0)
        });

      } else if (creditType === 'vip') {
        let days = 30;
        const planStr = String(amountOrPlan).replace('vip_', '').replace(/^v_?/, '');
        if (planStr === '3m') days = 90;
        if (planStr === '6m') days = 180;
        if (planStr === '12m' || planStr === '1y') days = 365;
        if (planStr === 'lifetime') days = 36500;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: `vip_${planStr}`,
          amount: 0,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Admin Manual VIP: ${note || 'Customer Resolution'}`,
        });

        await supabase.from('profiles').update({
          is_vip_member: true,
          vip_expires_at: expiresAt.toISOString(),
        }).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: `Successfully granted VIP status (${days} days) to ${targetUser.full_name}.`,
          user: targetUser,
          vipExpiresAt: expiresAt.toISOString()
        });

      } else {
        // Standard Premium
        let days = 30;
        const planStr = String(amountOrPlan);
        if (planStr === '3m') days = 90;
        if (planStr === '6m') days = 180;
        if (planStr === '12m' || planStr === '1y') days = 365;
        if (planStr === 'lifetime') days = 36500;

        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + days);

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planStr,
          amount: 0,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Admin Manual Premium: ${note || 'Customer Resolution'}`,
        });

        await supabase.from('profiles').update({
          premium_until: premiumUntil.toISOString(),
        }).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: `Successfully granted Premium status (${days} days) to ${targetUser.full_name}.`,
          user: targetUser,
          premiumUntil: premiumUntil.toISOString()
        });
      }

    } else if (action === 'verify_chapa_ref') {
      const { chapaRef, autoProcess } = body;

      if (!chapaRef) {
        return NextResponse.json({ status: 'error', message: 'Missing chapaRef parameter' }, { status: 400 });
      }

      const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
      if (!chapaSecretKey) {
        return NextResponse.json({ status: 'error', message: 'CHAPA_SECRET_KEY not configured on server' }, { status: 500 });
      }

      const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${chapaRef.trim()}`, {
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`,
          'Content-Type': 'application/json'
        }
      });

      const chapaData = await chapaRes.json();

      if (chapaData.status !== 'success' || !chapaData.data) {
        return NextResponse.json({
          status: 'error',
          message: `Chapa lookup failed: ${chapaData.message || 'Transaction not found'}`
        }, { status: 404 });
      }

      const tx = chapaData.data;

      // If autoProcess requested and transaction was successful
      if (autoProcess && tx.status === 'success') {
        const txRef = tx.tx_ref || chapaRef;
        const email = tx.email;

        // Try to locate user by tx_ref UUID or email
        let targetUser = null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = txRef.match(uuidRegex);

        if (match) {
          const { data: p } = await supabase.from('profiles').select('id, full_name, email').eq('id', match[0]).single();
          targetUser = p;
        }

        if (!targetUser && email) {
          const { data: p } = await supabase.from('profiles').select('id, full_name, email').eq('email', email).single();
          targetUser = p;
        }

        if (!targetUser) {
          return NextResponse.json({
            status: 'warning',
            message: `Chapa payment verified successfully (${tx.amount} ${tx.currency}), but user could not be automatically matched by email (${email}) or tx_ref (${txRef}). Please credit manually.`,
            chapaData: tx
          });
        }

        // Determine plan from tx_ref
        let planType = 'coins_100';
        if (match) {
          planType = txRef.substring(match[0].length + 1).split('-')[0] || 'coins_100';
        }

        const isCoins = planType.startsWith('coins_') || planType.startsWith('c');
        const isVip = planType.startsWith('vip_') || planType.startsWith('v');

        if (isCoins) {
          const amountCoins = planType.startsWith('coins_')
            ? (parseInt(planType.replace('coins_', '')) || 50)
            : (parseInt(planType.replace(/^c_?/, '')) || 50);

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: `coins_${amountCoins}`,
            amount: parseFloat(String(tx.amount || 0)),
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${tx.reference || chapaRef})`,
          });

          await supabase.from('coin_transactions').insert({
            user_id: targetUser.id,
            amount: amountCoins,
            type: 'purchase',
            note: `Chapa Ref Lookup Processed: ${amountCoins} coins`
          });

          const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', targetUser.id).maybeSingle();

          return NextResponse.json({
            status: 'success',
            message: `Verified and credited ${amountCoins} coins to ${targetUser.full_name} (${targetUser.email}).`,
            chapaData: tx,
            user: targetUser,
            coinBalance: Number(wallet?.coin_balance || 0)
          });
        } else if (isVip) {
          let days = 30;
          const cleanPlan = planType.startsWith('vip_') ? planType.replace('vip_', '') : planType.replace(/^v_?/, '');
          if (cleanPlan === '3m') days = 90;
          if (cleanPlan === '6m') days = 180;
          if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
          if (cleanPlan === 'lifetime') days = 36500;

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: `vip_${cleanPlan}`,
            amount: parseFloat(String(tx.amount || 0)),
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${tx.reference || chapaRef})`,
          });

          await supabase.from('profiles').update({
            is_vip_member: true,
            vip_expires_at: expiresAt.toISOString(),
          }).eq('id', targetUser.id);

          return NextResponse.json({
            status: 'success',
            message: `Verified and upgraded VIP status for ${targetUser.full_name}.`,
            chapaData: tx,
            user: targetUser,
            vipExpiresAt: expiresAt.toISOString()
          });
        } else {
          // Standard Premium
          let days = 30;
          if (planType === '3m') days = 90;
          if (planType === '6m') days = 180;
          if (planType === '12m' || planType === '1y') days = 365;
          if (planType === 'lifetime') days = 36500;

          const premiumUntil = new Date();
          premiumUntil.setDate(premiumUntil.getDate() + days);

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: planType,
            amount: parseFloat(String(tx.amount || 0)),
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${tx.reference || chapaRef})`,
          });

          await supabase.from('profiles').update({
            premium_until: premiumUntil.toISOString(),
          }).eq('id', targetUser.id);

          return NextResponse.json({
            status: 'success',
            message: `Verified and upgraded Premium status for ${targetUser.full_name}.`,
            chapaData: tx,
            user: targetUser,
            premiumUntil: premiumUntil.toISOString()
          });
        }
      }

      return NextResponse.json({
        status: 'success',
        message: 'Chapa transaction details fetched successfully',
        chapaData: tx
      });
    }

    return NextResponse.json({ status: 'error', message: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Admin manual payment error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
