import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { resolveCoinAmount } from '@/lib/coins';

/**
 * Admin API Endpoint (/api/admin/payments/manual)
 * Allows admins to:
 * 1. Manually credit coins, VIP, or Premium to any user by email or ID.
 * 2. Lookup and verify any Chapa transaction reference directly from Chapa API.
 * 3. Sync all transactions from Chapa's dashboard that aren't registered.
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
        const numCoins = resolveCoinAmount(String(amountOrPlan), 0, 'ETB');

        await supabase.from('payments').insert({
          user_id: userId,
          plan_type: `coins_${numCoins}`,
          amount: 0,
          currency: 'ETB',
          status: 'approved',
          receipt_url: `Admin Manual Credit: ${note || 'Customer Resolution'}`,
        });

        // Mirror into financial_transactions
        await supabase.from('financial_transactions').insert({
          user_id: userId,
          user_name_snapshot: targetUser.full_name || 'Beteseb User',
          user_email_snapshot: targetUser.email || null,
          revenue_source: 'coin_sale',
          payment_gateway: 'manual_admin',
          currency: 'ETB',
          gross_amount: 0,
          gateway_fee: 0,
          net_amount: 0,
          payment_status: 'completed',
          metadata: { note: note || 'Admin Manual Coin Credit' }
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
        const isLifetime = planStr === 'lifetime';
        if (planStr === '3m') days = 90;
        if (planStr === '6m') days = 180;
        if (planStr === '12m' || planStr === '1y') days = 365;
        if (isLifetime) days = 36500;

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

        // Mirror into financial_transactions
        await supabase.from('financial_transactions').insert({
          user_id: userId,
          user_name_snapshot: targetUser.full_name || 'Beteseb User',
          user_email_snapshot: targetUser.email || null,
          revenue_source: 'subscription_vip',
          payment_gateway: 'manual_admin',
          currency: 'ETB',
          gross_amount: 0,
          gateway_fee: 0,
          net_amount: 0,
          payment_status: 'completed',
          metadata: { note: note || 'Admin Manual VIP Status' }
        });

        const vipUpdatePayload: any = {
          is_vip_member: true,
          vip_expires_at: expiresAt.toISOString(),
        };
        if (isLifetime) {
          vipUpdatePayload.is_lifetime = true;
        }

        await supabase.from('profiles').update(vipUpdatePayload).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: `Successfully granted VIP status (${isLifetime ? 'Lifetime' : `${days} days`}) to ${targetUser.full_name}.`,
          user: targetUser,
          vipExpiresAt: expiresAt.toISOString(),
          isLifetime
        });

      } else {
        // Standard Premium
        let days = 30;
        const planStr = String(amountOrPlan);
        const isLifetime = planStr === 'lifetime';
        if (planStr === '3m') days = 90;
        if (planStr === '6m') days = 180;
        if (planStr === '12m' || planStr === '1y') days = 365;
        if (isLifetime) days = 36500;

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

        // Mirror into financial_transactions
        await supabase.from('financial_transactions').insert({
          user_id: userId,
          user_name_snapshot: targetUser.full_name || 'Beteseb User',
          user_email_snapshot: targetUser.email || null,
          revenue_source: 'subscription_premium',
          payment_gateway: 'manual_admin',
          currency: 'ETB',
          gross_amount: 0,
          gateway_fee: 0,
          net_amount: 0,
          payment_status: 'completed',
          metadata: { note: note || 'Admin Manual Premium Status' }
        });

        const premUpdatePayload: any = {
          premium_until: premiumUntil.toISOString(),
        };
        if (isLifetime) {
          premUpdatePayload.is_lifetime = true;
        }

        await supabase.from('profiles').update(premUpdatePayload).eq('id', userId);

        return NextResponse.json({
          status: 'success',
          message: `Successfully granted Premium status (${isLifetime ? 'Lifetime' : `${days} days`}) to ${targetUser.full_name}.`,
          user: targetUser,
          premiumUntil: premiumUntil.toISOString(),
          isLifetime
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

        const paidAmt = parseFloat(String(tx.amount || 0));
        const fee = Math.round(paidAmt * 0.035 * 100) / 100;

        if (isCoins) {
          const amountCoins = resolveCoinAmount(planType, paidAmt, 'ETB');

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: `coins_${amountCoins}`,
            amount: paidAmt,
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${tx.reference || chapaRef})`,
          });

          await supabase.from('financial_transactions').insert({
            tx_ref: txRef,
            user_id: targetUser.id,
            user_name_snapshot: targetUser.full_name || 'Beteseb User',
            user_email_snapshot: targetUser.email || null,
            revenue_source: 'coin_sale',
            payment_gateway: 'chapa',
            currency: tx.currency || 'ETB',
            gross_amount: paidAmt,
            gateway_fee: fee,
            net_amount: Math.max(0, paidAmt - fee),
            payment_status: 'completed'
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
          const isLifetime = cleanPlan === 'lifetime' || planType.endsWith('lifetime');
          if (cleanPlan === '3m') days = 90;
          if (cleanPlan === '6m') days = 180;
          if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
          if (isLifetime) days = 36500;

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: `vip_${cleanPlan}`,
            amount: paidAmt,
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${tx.reference || chapaRef})`,
          });

          await supabase.from('financial_transactions').insert({
            tx_ref: txRef,
            user_id: targetUser.id,
            user_name_snapshot: targetUser.full_name || 'Beteseb User',
            user_email_snapshot: targetUser.email || null,
            revenue_source: 'subscription_vip',
            payment_gateway: 'chapa',
            currency: tx.currency || 'ETB',
            gross_amount: paidAmt,
            gateway_fee: fee,
            net_amount: Math.max(0, paidAmt - fee),
            payment_status: 'completed'
          });

          const vipUpdatePayload: any = {
            is_vip_member: true,
            vip_expires_at: expiresAt.toISOString(),
          };
          if (isLifetime) {
            vipUpdatePayload.is_lifetime = true;
          }

          await supabase.from('profiles').update(vipUpdatePayload).eq('id', targetUser.id);

          return NextResponse.json({
            status: 'success',
            message: `Verified and upgraded VIP status for ${targetUser.full_name}.`,
            chapaData: tx,
            user: targetUser,
            vipExpiresAt: expiresAt.toISOString(),
            isLifetime
          });
        } else {
          // Standard Premium
          let days = 30;
          const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
          if (planType === '3m') days = 90;
          if (planType === '6m') days = 180;
          if (planType === '12m' || planType === '1y') days = 365;
          if (isLifetime) days = 36500;

          const premiumUntil = new Date();
          premiumUntil.setDate(premiumUntil.getDate() + days);

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: planType,
            amount: paidAmt,
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${tx.reference || chapaRef})`,
          });

          await supabase.from('financial_transactions').insert({
            tx_ref: txRef,
            user_id: targetUser.id,
            user_name_snapshot: targetUser.full_name || 'Beteseb User',
            user_email_snapshot: targetUser.email || null,
            revenue_source: 'subscription_premium',
            payment_gateway: 'chapa',
            currency: tx.currency || 'ETB',
            gross_amount: paidAmt,
            gateway_fee: fee,
            net_amount: Math.max(0, paidAmt - fee),
            payment_status: 'completed'
          });

          const premUpdatePayload: any = {
            premium_until: premiumUntil.toISOString(),
          };
          if (isLifetime) {
            premUpdatePayload.is_lifetime = true;
          }

          await supabase.from('profiles').update(premUpdatePayload).eq('id', targetUser.id);

          return NextResponse.json({
            status: 'success',
            message: `Verified and upgraded Premium status for ${targetUser.full_name}.`,
            chapaData: tx,
            user: targetUser,
            premiumUntil: premiumUntil.toISOString(),
            isLifetime
          });
        }
      }

      return NextResponse.json({
        status: 'success',
        message: 'Chapa transaction details fetched successfully',
        chapaData: tx
      });

    } else if (action === 'sync_chapa_transactions') {
      const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
      if (!chapaSecretKey) {
        return NextResponse.json({ status: 'error', message: 'CHAPA_SECRET_KEY not configured on server' }, { status: 500 });
      }

      // Fetch transaction list from Chapa
      const chapaRes = await fetch('https://api.chapa.co/v1/transactions', {
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`
        }
      });

      const chapaData = await chapaRes.json();
      if (chapaData.status !== 'success' || !chapaData.data?.transactions) {
        return NextResponse.json({
          status: 'error',
          message: `Chapa transactions retrieval failed: ${chapaData.message || 'Unknown response'}`
        }, { status: 500 });
      }

      const transactions = chapaData.data.transactions;
      const syncedList = [];
      const skippedList = [];
      const failedList = [];

      for (const rawTx of transactions) {
        if (rawTx.status !== 'success') {
          skippedList.push({ ref_id: rawTx.ref_id, reason: `Status is ${rawTx.status}` });
          continue;
        }

        const chapaRef = rawTx.ref_id;
        const amount = parseFloat(String(rawTx.amount || 0));

        // Check if this payment already exists in database
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .or(`receipt_url.ilike.%${chapaRef}%,receipt_url.ilike.%${rawTx.trans_id}%`)
          .maybeSingle();

        if (existingPayment) {
          skippedList.push({ ref_id: chapaRef, reason: 'Already exists in database' });
          continue;
        }

        // Fetch full details to get the actual user ID and plan type
        const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${chapaRef}`, {
          headers: {
            Authorization: `Bearer ${chapaSecretKey}`
          }
        });
        const verifyData = await verifyRes.json();

        if (verifyData.status !== 'success' || !verifyData.data) {
          failedList.push({ ref_id: chapaRef, reason: `Verify API call failed: ${verifyData.message || 'Unknown'}` });
          continue;
        }

        const tx = verifyData.data;
        const txRef = tx.tx_ref || chapaRef;
        const email = tx.email;

        // Try to locate user by tx_ref UUID or email
        let targetUser = null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = txRef.match(uuidRegex);

        if (match) {
          const { data: p } = await supabase.from('profiles').select('id, full_name, email').eq('id', match[0]).maybeSingle();
          targetUser = p;
        }

        if (!targetUser && email) {
          const { data: p } = await supabase.from('profiles').select('id, full_name, email').eq('email', email).maybeSingle();
          targetUser = p;
        }

        if (!targetUser) {
          failedList.push({ ref_id: chapaRef, reason: `Could not match user with email ${email} or tx_ref ${txRef}` });
          continue;
        }

        // Determine plan from tx_ref or amount
        let planType = 'coins_100';
        if (match) {
          planType = txRef.substring(match[0].length + 1).split('-')[0] || 'coins_100';
        } else {
          // If no planType found in tx_ref, infer from amount
          if (amount === 299.98) planType = 'vip_1m';
          else if (amount === 149.99) planType = '1m';
          else if (amount === 100.00) planType = 'coins_100';
          else planType = `coins_${amount}`;
        }

        const isCoins = planType.startsWith('coins_') || planType.startsWith('c');
        const isVip = planType.startsWith('vip_') || planType.startsWith('v');
        const fee = Math.round(amount * 0.035 * 100) / 100;

        if (isCoins) {
          const amountCoins = resolveCoinAmount(planType, amount, 'ETB');

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: `coins_${amountCoins}`,
            amount: amount,
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${chapaRef})`,
            created_at: tx.created_at || new Date().toISOString()
          });

          await supabase.from('financial_transactions').insert({
            tx_ref: txRef,
            user_id: targetUser.id,
            user_name_snapshot: targetUser.full_name || 'Beteseb User',
            user_email_snapshot: targetUser.email || null,
            revenue_source: 'coin_sale',
            payment_gateway: 'chapa',
            currency: tx.currency || 'ETB',
            gross_amount: amount,
            gateway_fee: fee,
            net_amount: Math.max(0, amount - fee),
            payment_status: 'completed',
            created_at: tx.created_at || new Date().toISOString()
          });

          await supabase.from('coin_transactions').insert({
            user_id: targetUser.id,
            amount: amountCoins,
            type: 'purchase',
            note: `Chapa Sync Recovery: ${amountCoins} coins (${chapaRef})`,
            created_at: tx.created_at || new Date().toISOString()
          });

          syncedList.push({
            ref_id: chapaRef,
            user: targetUser.full_name,
            email: targetUser.email,
            type: 'coins',
            details: `${amountCoins} coins`
          });
        } else if (isVip) {
          let days = 30;
          const cleanPlan = planType.startsWith('vip_') ? planType.replace('vip_', '') : planType.replace(/^v_?/, '');
          const isLifetime = cleanPlan === 'lifetime' || planType.endsWith('lifetime');
          if (cleanPlan === '3m') days = 90;
          if (cleanPlan === '6m') days = 180;
          if (cleanPlan === '12m' || cleanPlan === '1y') days = 365;
          if (isLifetime) days = 36500;

          const baseDate = tx.created_at ? new Date(tx.created_at) : new Date();
          const expiresAt = new Date(baseDate);
          expiresAt.setDate(expiresAt.getDate() + days);

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: `vip_${cleanPlan}`,
            amount: amount,
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${chapaRef})`,
            created_at: tx.created_at || new Date().toISOString()
          });

          await supabase.from('financial_transactions').insert({
            tx_ref: txRef,
            user_id: targetUser.id,
            user_name_snapshot: targetUser.full_name || 'Beteseb User',
            user_email_snapshot: targetUser.email || null,
            revenue_source: 'subscription_vip',
            payment_gateway: 'chapa',
            currency: tx.currency || 'ETB',
            gross_amount: amount,
            gateway_fee: fee,
            net_amount: Math.max(0, amount - fee),
            payment_status: 'completed',
            created_at: tx.created_at || new Date().toISOString()
          });

          const vipUpdatePayload: any = {
            is_vip_member: true,
            vip_expires_at: expiresAt.toISOString(),
          };
          if (isLifetime) {
            vipUpdatePayload.is_lifetime = true;
          }

          await supabase.from('profiles').update(vipUpdatePayload).eq('id', targetUser.id);

          syncedList.push({
            ref_id: chapaRef,
            user: targetUser.full_name,
            email: targetUser.email,
            type: 'vip',
            details: `VIP for ${days} days`
          });
        } else {
          // Standard Premium
          let days = 30;
          const isLifetime = planType === 'lifetime' || planType.endsWith('lifetime');
          if (planType === '3m') days = 90;
          if (planType === '6m') days = 180;
          if (planType === '12m' || planType === '1y') days = 365;
          if (isLifetime) days = 36500;

          const baseDate = tx.created_at ? new Date(tx.created_at) : new Date();
          const premiumUntil = new Date(baseDate);
          premiumUntil.setDate(premiumUntil.getDate() + days);

          await supabase.from('payments').insert({
            user_id: targetUser.id,
            plan_type: planType,
            amount: amount,
            currency: tx.currency || 'ETB',
            status: 'approved',
            receipt_url: `Chapa TX: ${txRef} (Ref: ${chapaRef})`,
            created_at: tx.created_at || new Date().toISOString()
          });

          await supabase.from('financial_transactions').insert({
            tx_ref: txRef,
            user_id: targetUser.id,
            user_name_snapshot: targetUser.full_name || 'Beteseb User',
            user_email_snapshot: targetUser.email || null,
            revenue_source: 'subscription_premium',
            payment_gateway: 'chapa',
            currency: tx.currency || 'ETB',
            gross_amount: amount,
            gateway_fee: fee,
            net_amount: Math.max(0, amount - fee),
            payment_status: 'completed',
            created_at: tx.created_at || new Date().toISOString()
          });

          const premUpdatePayload: any = {
            premium_until: premiumUntil.toISOString(),
          };
          if (isLifetime) {
            premUpdatePayload.is_lifetime = true;
          }

          await supabase.from('profiles').update(premUpdatePayload).eq('id', targetUser.id);

          syncedList.push({
            ref_id: chapaRef,
            user: targetUser.full_name,
            email: targetUser.email,
            type: 'premium',
            details: `Premium for ${days} days`
          });
        }
      }

      return NextResponse.json({
        status: 'success',
        message: `Chapa payment sync completed. Synced: ${syncedList.length}, Skipped: ${skippedList.length}, Failed: ${failedList.length}`,
        synced: syncedList,
        skipped: skippedList,
        failed: failedList
      });
    }

    return NextResponse.json({ status: 'error', message: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Admin manual payment error:', error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
