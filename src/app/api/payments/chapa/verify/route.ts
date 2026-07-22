import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { resolveCoinAmount, COIN_PACKAGES } from '@/lib/coins';

/**
 * BETESEB — Chapa Payment Verification Endpoint
 *
 * Called from the client after Chapa redirects the user back to the app.
 * Verifies the transaction with Chapa's official verify API, then
 * records the payment and upgrades the user profile automatically.
 *
 * POST /api/payments/chapa/verify
 * Body: { tx_ref: string, userId: string }
 */

const PLAN_DAYS: Record<string, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  '12m': 365,
  'lifetime': 36500,
};

export async function POST(req: Request) {
  try {
    const { tx_ref, userId } = await req.json();

    if (!tx_ref || !userId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing tx_ref or userId' },
        { status: 400 }
      );
    }

    // ── 1. Idempotency — prevent double-processing the same tx_ref ────────────
    // Check payments table (covers both real and demo modes)
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status, plan_type')
      .or(`receipt_url.eq.Chapa TX: ${tx_ref},receipt_url.eq.Chapa TX (Simulated): ${tx_ref}`)
      .maybeSingle();

    if (existing) {
      console.log(`[Chapa Verify] tx_ref ${tx_ref} already processed in payments table — skipping.`);
      const existingPlanType = existing.plan_type || tx_ref.split('-')[1] || '';
      const existingType = existingPlanType.startsWith('coins_') ? 'coins'
        : existingPlanType.startsWith('vip_') ? 'vip'
        : 'premium';
      return NextResponse.json({
        status: 'success',
        message: 'Payment already verified and processed',
        alreadyProcessed: true,
        type: existingType,
      });
    }

    // Secondary idempotency check on financial_transactions (catches any race conditions)
    const { data: existingFt } = await supabase
      .from('financial_transactions')
      .select('id, revenue_source')
      .eq('tx_ref', tx_ref)
      .maybeSingle();

    if (existingFt) {
      console.log(`[Chapa Verify] tx_ref ${tx_ref} already exists in financial_transactions — skipping.`);
      const ftType = existingFt.revenue_source === 'coin_sale' ? 'coins'
        : existingFt.revenue_source === 'subscription_vip' ? 'vip'
        : 'premium';
      return NextResponse.json({
        status: 'success',
        message: 'Payment already recorded in ledger',
        alreadyProcessed: true,
        type: ftType,
      });
    }

    // ── 2. Verify with Chapa API ───────────────────────────────────────────────
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

    if (!chapaSecretKey) {
      // Dev/demo mode: no key configured — simulate success
      console.warn('[Chapa Verify] CHAPA_SECRET_KEY not set. Running in demo mode.');

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const match = tx_ref.match(uuidRegex);
      let extractedUserId = '';
      let planType = '';
      if (match) {
        extractedUserId = match[0];
        planType = tx_ref.substring(extractedUserId.length + 1).split('-')[0];
      } else {
        const parts = tx_ref.split('-');
        extractedUserId = parts[0];
        planType = parts[1];
      }

      if (extractedUserId !== userId) {
        return NextResponse.json(
          { status: 'error', message: `User ID mismatch in tx_ref (Expected: ${userId}, Got: ${extractedUserId})` },
          { status: 403 }
        );
      }

      const isCoins = planType.startsWith('coins_') || /^c\d+/.test(planType) || planType.startsWith('c_');
      const isCourse = planType.startsWith('course_') || planType.startsWith('video_');
      const isVip = planType.startsWith('vip_') || /^v_?\d+/.test(planType) || planType.endsWith('vip');

      const { data: profileData } = await supabase.from('profiles').select('full_name, email').eq('id', userId).maybeSingle();
      const userName = profileData?.full_name || profileData?.email || 'Beteseb User';
      const userEmail = profileData?.email || null;

      if (isCourse) {
        const videoId = planType.replace(/^(course_|video_)/, '');
        const simulatedPrice = 30;
        const simulatedFee = Math.round(simulatedPrice * 0.035 * 100) / 100;

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planType,
          amount: simulatedPrice,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Chapa TX (Simulated): ${tx_ref}`,
        });

        await supabase.from('financial_transactions').upsert({
          tx_ref: tx_ref,
          user_id: userId,
          user_name_snapshot: userName,
          user_email_snapshot: userEmail,
          revenue_source: 'course_sale',
          payment_gateway: 'chapa',
          currency: 'ETB',
          gross_amount: simulatedPrice,
          gateway_fee: simulatedFee,
          net_amount: Math.max(0, simulatedPrice - simulatedFee),
          payment_status: 'completed'
        }, { onConflict: 'tx_ref', ignoreDuplicates: true });

        if (videoId) {
          await supabase.from('user_unlocked_videos').insert({
            user_id: userId,
            video_id: videoId
          });
        }

        return NextResponse.json({
          status: 'success',
          message: 'Demo: Course purchase verified and unlocked successfully.',
          videoId,
          type: 'course',
        });
      } else if (isCoins) {
        const amountCoins = resolveCoinAmount(planType, 0, 'ETB');

        const pack = COIN_PACKAGES.find(p => p.id === planType || p.id === `coins_${planType.replace(/^c_?/, '')}`);
        const simulatedPrice = pack ? pack.priceEtb : 30;
        const simulatedFee = Math.round(simulatedPrice * 0.035 * 100) / 100;

        // Demo mode: guard against duplicate payments insert
        const { error: paymentsInsertErr } = await supabase.from('payments').insert({
          user_id: userId,
          plan_type: `coins_${amountCoins}`,
          amount: simulatedPrice,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Chapa TX (Simulated): ${tx_ref}`,
        });
        if (paymentsInsertErr) console.error('[Chapa Verify Demo] Failed to insert payment record:', paymentsInsertErr.message);

        const { error: ftCoinsSimErr } = await supabase.from('financial_transactions').upsert({
          tx_ref: tx_ref,
          user_id: userId,
          user_name_snapshot: userName,
          user_email_snapshot: userEmail,
          revenue_source: 'coin_sale',
          payment_gateway: 'chapa',
          currency: 'ETB',
          gross_amount: simulatedPrice,
          gateway_fee: simulatedFee,
          net_amount: Math.max(0, simulatedPrice - simulatedFee),
          payment_status: 'completed'
        }, { onConflict: 'tx_ref', ignoreDuplicates: true });
        if (ftCoinsSimErr) console.error('[Chapa Verify Demo] Failed to upsert financial_transaction (coins):', ftCoinsSimErr.message);

        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: amountCoins,
          type: 'purchase',
          note: `Chapa Coin Purchase (Simulated): ${planType}`
        });

        const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();
        const currentBalance = Number(wallet?.coin_balance || 0);

        return NextResponse.json({
          status: 'success',
          message: `Demo: Coin purchase verified and credited ${amountCoins} coins successfully.`,
          coinBalance: currentBalance,
          type: 'coins',
        });
      } else if (isVip) {
        let days = 30;
        const cleanPlan = planType.startsWith('vip_') ? planType.replace('vip_', '') : planType.replace(/^v_?/, '');
        const isLifetime = cleanPlan === 'lifetime' || planType.endsWith('lifetime');
        if (cleanPlan === '3m') days = 90;
        if (cleanPlan === '6m') days = 180;
        if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
        if (isLifetime) days = 36500;

        let simulatedPrice = 299.98;
        if (cleanPlan === '3m') simulatedPrice = 759.98;
        if (cleanPlan === '6m') simulatedPrice = 1299.98;
        if (cleanPlan === '12m' || cleanPlan === '1y') simulatedPrice = 1999.98;
        if (isLifetime) simulatedPrice = 2999.98;

        const simulatedFee = Math.round(simulatedPrice * 0.035 * 100) / 100;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        const { error: vipPaymentsSimErr } = await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planType,
          amount: simulatedPrice,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Chapa TX (Simulated): ${tx_ref}`,
        });
        if (vipPaymentsSimErr) console.error('[Chapa Verify Demo] Failed to insert VIP payment record:', vipPaymentsSimErr.message);

        const { error: ftVipSimErr } = await supabase.from('financial_transactions').upsert({
          tx_ref: tx_ref,
          user_id: userId,
          user_name_snapshot: userName,
          user_email_snapshot: userEmail,
          revenue_source: 'subscription_vip',
          payment_gateway: 'chapa',
          currency: 'ETB',
          gross_amount: simulatedPrice,
          gateway_fee: simulatedFee,
          net_amount: Math.max(0, simulatedPrice - simulatedFee),
          payment_status: 'completed'
        }, { onConflict: 'tx_ref', ignoreDuplicates: true });
        if (ftVipSimErr) console.error('[Chapa Verify Demo] Failed to upsert financial_transaction (VIP):', ftVipSimErr.message);

        const updatePayload: any = {
          is_vip_member: true,
          vip_expires_at: expiresAt.toISOString(),
        };
        if (isLifetime) {
          updatePayload.is_lifetime = true;
        }

        await supabase.from('profiles').update(updatePayload).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: 'Demo: VIP purchase verified and profile upgraded',
          vipExpiresAt: expiresAt.toISOString(),
          isLifetime,
          type: 'vip',
        });
      } else {
        const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
        const days = PLAN_DAYS[planType] ?? (isLifetime ? 36500 : 30);
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + days);

        let simulatedPrice = 149.99;
        if (planType === '3m') simulatedPrice = 379.99;
        if (planType === '6m') simulatedPrice = 649.99;
        if (planType === '12m' || planType === '1y') simulatedPrice = 999.99;
        if (isLifetime) simulatedPrice = 1499.99;

        const simulatedFee = Math.round(simulatedPrice * 0.035 * 100) / 100;

        const { error: premPaymentsSimErr } = await supabase.from('payments').insert({
          user_id: userId,
          plan_type: planType,
          amount: simulatedPrice,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Chapa TX (Simulated): ${tx_ref}`,
        });
        if (premPaymentsSimErr) console.error('[Chapa Verify Demo] Failed to insert Premium payment record:', premPaymentsSimErr.message);

        const { error: ftPremSimErr } = await supabase.from('financial_transactions').upsert({
          tx_ref: tx_ref,
          user_id: userId,
          user_name_snapshot: userName,
          user_email_snapshot: userEmail,
          revenue_source: 'subscription_premium',
          payment_gateway: 'chapa',
          currency: 'ETB',
          gross_amount: simulatedPrice,
          gateway_fee: simulatedFee,
          net_amount: Math.max(0, simulatedPrice - simulatedFee),
          payment_status: 'completed'
        }, { onConflict: 'tx_ref', ignoreDuplicates: true });
        if (ftPremSimErr) console.error('[Chapa Verify Demo] Failed to upsert financial_transaction (Premium):', ftPremSimErr.message);

        const updatePayload: any = {
          premium_until: premiumUntil.toISOString(),
        };
        if (isLifetime) {
          updatePayload.is_lifetime = true;
        }

        await supabase.from('profiles').update(updatePayload).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: 'Demo: Payment verified and profile upgraded',
          premiumUntil: premiumUntil.toISOString(),
          isLifetime,
          type: 'premium',
        });
      }
    }

    // Real Chapa verification
    const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const chapaData = await chapaRes.json();

    if (chapaData.status !== 'success') {
      console.error('[Chapa Verify] Chapa API returned non-success:', chapaData);
      return NextResponse.json(
        { status: 'error', message: `Chapa verification failed: ${chapaData.message || 'Unknown error'}` },
        { status: 400 }
      );
    }

    const txData = chapaData.data;
    const txStatus = txData?.status;

    // Chapa transaction statuses: 'success', 'pending', 'failed'
    if (txStatus !== 'success') {
      return NextResponse.json(
        { status: 'error', message: `Transaction status is "${txStatus}" — not completed yet` },
        { status: 400 }
      );
    }

    // ── 3. Validate the tx_ref belongs to this user ────────────────────────────
    // tx_ref format: "userId-planType-timestamp"
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = tx_ref.match(uuidRegex);
    let extractedUserId = '';
    let planType = '';
    if (match) {
      extractedUserId = match[0];
      planType = tx_ref.substring(extractedUserId.length + 1).split('-')[0];
    } else {
      const parts = tx_ref.split('-');
      extractedUserId = parts[0];
      planType = parts[1];
    }

    if (extractedUserId !== userId) {
      console.error(`[Chapa Verify] UserId mismatch: expected ${userId}, got ${extractedUserId}`);
      return NextResponse.json(
        { status: 'error', message: `User ID mismatch — transaction does not belong to this user (Expected: ${userId}, Got: ${extractedUserId})` },
        { status: 403 }
      );
    }

    if (!planType) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid transaction reference format — missing plan type' },
        { status: 400 }
      );
    }

    const isCoins = planType.startsWith('coins_') || /^c\d+/.test(planType) || planType.startsWith('c_');
    const isCourse = planType.startsWith('course_') || planType.startsWith('video_');
    const isVip = planType.startsWith('vip_') || /^v_?\d+/.test(planType) || planType.endsWith('vip');

    const { data: profileData } = await supabase.from('profiles').select('full_name, email').eq('id', userId).maybeSingle();

    if (isCourse) {
      const videoId = planType.replace(/^(course_|video_)/, '');
      const courseAmt = parseFloat(String(txData?.amount || 0));

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: courseAmt,
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      const courseFee = Math.round(courseAmt * 0.035 * 100) / 100;
      const { error: ftCourseErr } = await supabase.from('financial_transactions').upsert({
        tx_ref: tx_ref,
        user_id: userId,
        user_name_snapshot: profileData?.full_name || profileData?.email || 'Beteseb User',
        user_email_snapshot: profileData?.email || null,
        revenue_source: 'course_sale',
        payment_gateway: 'chapa',
        currency: txData?.currency || 'ETB',
        gross_amount: courseAmt,
        gateway_fee: courseFee,
        net_amount: Math.max(0, courseAmt - courseFee),
        payment_status: 'completed'
      }, { onConflict: 'tx_ref', ignoreDuplicates: true });
      if (ftCourseErr) console.error('[Chapa Verify] Failed to upsert financial_transaction (course):', ftCourseErr.message);

      if (videoId) {
        await supabase.from('user_unlocked_videos').insert({
          user_id: userId,
          video_id: videoId
        });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Chapa course purchase verified and course unlocked successfully.',
        videoId,
        type: 'course',
      });
    } else if (isCoins) {
      const coinAmt = parseFloat(String(txData?.amount || 0));
      const amountCoins = resolveCoinAmount(planType, coinAmt, 'ETB');

      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: `coins_${amountCoins}`,
        amount: parseFloat(String(txData?.amount || 0)),
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      // Mirror into financial_transactions master ledger (upsert to prevent duplicates)
      const coinFee = Math.round(coinAmt * 0.035 * 100) / 100;
      const { error: ftCoinsErr } = await supabase.from('financial_transactions').upsert({
        tx_ref: tx_ref,
        user_id: userId,
        user_name_snapshot: profileData?.full_name || profileData?.email || 'Beteseb User',
        user_email_snapshot: profileData?.email || null,
        revenue_source: 'coin_sale',
        payment_gateway: 'chapa',
        currency: txData?.currency || 'ETB',
        gross_amount: coinAmt,
        gateway_fee: coinFee,
        net_amount: Math.max(0, coinAmt - coinFee),
        payment_status: 'completed'
      }, { onConflict: 'tx_ref', ignoreDuplicates: true });
      if (ftCoinsErr) console.error('[Chapa Verify] Failed to upsert financial_transaction (coins):', ftCoinsErr.message);

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: amountCoins,
        type: 'purchase',
        note: `Chapa Coin Purchase: ${amountCoins} coins (${tx_ref})`
      });

      const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();
      const currentBalance = Number(wallet?.coin_balance || 0);

      return NextResponse.json({
        status: 'success',
        message: `Chapa purchase verified and credited ${amountCoins} coins successfully.`,
        coinBalance: currentBalance,
        type: 'coins',
      });
    } else if (isVip) {
      let days = 30;
      const cleanPlan = planType.startsWith('vip_') ? planType.replace('vip_', '') : planType.replace(/^v_?/, '');
      const isLifetime = cleanPlan === 'lifetime' || planType.endsWith('lifetime');
      if (cleanPlan === '3m') days = 90;
      if (cleanPlan === '6m') days = 180;
      if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
      if (isLifetime) days = 36500;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const vipAmt = parseFloat(String(txData?.amount || 0));
      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: vipAmt,
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      // Mirror into financial_transactions master ledger (upsert to prevent duplicates)
      const vipFee = Math.round(vipAmt * 0.035 * 100) / 100;
      const { error: ftVipErr } = await supabase.from('financial_transactions').upsert({
        tx_ref: tx_ref,
        user_id: userId,
        user_name_snapshot: profileData?.full_name || profileData?.email || 'Beteseb User',
        user_email_snapshot: profileData?.email || null,
        revenue_source: 'subscription_vip',
        payment_gateway: 'chapa',
        currency: txData?.currency || 'ETB',
        gross_amount: vipAmt,
        gateway_fee: vipFee,
        net_amount: Math.max(0, vipAmt - vipFee),
        payment_status: 'completed'
      }, { onConflict: 'tx_ref', ignoreDuplicates: true });
      if (ftVipErr) console.error('[Chapa Verify] Failed to upsert financial_transaction (VIP):', ftVipErr.message);

      const vipUpdatePayload: any = {
        is_vip_member: true,
        vip_expires_at: expiresAt.toISOString(),
      };
      if (isLifetime) {
        vipUpdatePayload.is_lifetime = true;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(vipUpdatePayload)
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ status: 'error', message: 'Failed to update user VIP profile status' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Chapa VIP purchase verified and profile upgraded',
        vipExpiresAt: expiresAt.toISOString(),
        isLifetime,
        type: 'vip',
      });
    } else {
      const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
      const days = PLAN_DAYS[planType] ?? (isLifetime ? 36500 : 30);
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);

      const premAmt = parseFloat(String(txData?.amount || 0));
      await supabase.from('payments').insert({
        user_id: userId,
        plan_type: planType,
        amount: premAmt,
        currency: txData?.currency || 'ETB',
        status: 'approved',
        receipt_url: `Chapa TX: ${tx_ref}`,
      });

      // Mirror into financial_transactions master ledger (upsert to prevent duplicates)
      const premFee = Math.round(premAmt * 0.035 * 100) / 100;
      const { error: ftPremErr } = await supabase.from('financial_transactions').upsert({
        tx_ref: tx_ref,
        user_id: userId,
        user_name_snapshot: profileData?.full_name || profileData?.email || 'Beteseb User',
        user_email_snapshot: profileData?.email || null,
        revenue_source: 'subscription_premium',
        payment_gateway: 'chapa',
        currency: txData?.currency || 'ETB',
        gross_amount: premAmt,
        gateway_fee: premFee,
        net_amount: Math.max(0, premAmt - premFee),
        payment_status: 'completed'
      }, { onConflict: 'tx_ref', ignoreDuplicates: true });
      if (ftPremErr) console.error('[Chapa Verify] Failed to upsert financial_transaction (Premium):', ftPremErr.message);

      const premUpdatePayload: any = {
        premium_until: premiumUntil.toISOString()
      };
      if (isLifetime) {
        premUpdatePayload.is_lifetime = true;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(premUpdatePayload)
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ status: 'error', message: 'Failed to update user premium profile status' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified and profile upgraded successfully',
        premiumUntil: premiumUntil.toISOString(),
        isLifetime,
        planType,
        type: 'premium',
      });
    }
  } catch (error: any) {
    console.error('[Chapa Verify] Unhandled error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
