import { NextResponse } from 'next/server';

function sanitizeChapaTxRef(rawRef?: string): string {
  if (!rawRef) {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 5);
    return `tx_${ts}_${rand}`.slice(0, 50);
  }

  const cleanRef = rawRef.replace(/[^a-zA-Z0-9_-]/g, '');
  if (cleanRef.length <= 50) return cleanRef;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = cleanRef.match(uuidRegex);

  if (match) {
    const uuid = match[0]; // 36 chars
    const remainder = cleanRef.substring(uuid.length + 1);
    const remParts = remainder.split('-');
    const plan = (remParts[0] || 'sub').replace('coins_', 'c').replace('vip_', 'v').replace('lifetime', 'lt').slice(0, 5);
    const rand = Math.random().toString(36).substring(2, 5);
    const cleaned = `${uuid}-${plan}-${rand}`;
    return cleaned.slice(0, 50);
  }

  return cleanRef.slice(0, 50);
}

function cleanCustomizationText(text?: string, defaultText: string = 'Beteseb Payment'): string {
  if (!text || typeof text !== 'string') return defaultText;
  const clean = text.replace(/[^a-zA-Z0-9_\-\.\s]/g, '').trim();
  return clean.length > 0 ? clean.slice(0, 100) : defaultText;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, currency, email, first_name, last_name, tx_ref, callback_url, return_url, customization } = body;

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    const chapaSubAccountId = process.env.CHAPA_SUBACCOUNT_ID;

    // 1. Amount validation & formatting
    const rawAmount = Number(amount);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        { status: 'failed', message: 'Invalid transaction amount. Amount must be a positive number.' },
        { status: 400 }
      );
    }
    const finalAmount = Number(rawAmount.toFixed(2));
    if (finalAmount < 1) {
      return NextResponse.json(
        { status: 'failed', message: 'Minimum transaction amount is 1.00.' },
        { status: 400 }
      );
    }

    // 2. Currency validation (USD stays USD, ETB stays ETB — no automatic conversion)
    const finalCurrency = (currency && typeof currency === 'string' ? currency.trim().toUpperCase() : 'ETB');
    if (!['ETB', 'USD'].includes(finalCurrency)) {
      return NextResponse.json(
        { status: 'failed', message: 'Invalid currency code. Supported currencies: ETB, USD.' },
        { status: 400 }
      );
    }

    // 3. Unique TxRef generation & sanitization (<= 50 chars)
    const safeTxRef = sanitizeChapaTxRef(tx_ref);

    // 4. Strict Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = (email && typeof email === 'string' && emailRegex.test(email.trim()) && !email.includes('example.com'))
      ? email.trim()
      : `user_${safeTxRef.replace(/[^a-zA-Z0-9]/g, '').slice(-12)}@beteseb1.online`;

    // 5. Name formatting
    const validFirstName = (first_name && typeof first_name === 'string' && first_name.trim()) ? first_name.trim().slice(0, 30) : 'Beteseb';
    const validLastName = (last_name && typeof last_name === 'string' && last_name.trim()) ? last_name.trim().slice(0, 30) : 'Member';

    // 6. Callback & Return URL absolute path validation
    const reqOrigin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || process.env.NEXT_PUBLIC_APP_URL || 'https://beteseb1.online';
    const validCallbackUrl = callback_url ? (callback_url.startsWith('http') ? callback_url : `${reqOrigin}${callback_url}`) : `${reqOrigin}/api/payments/chapa/webhook`;
    const validReturnUrl = return_url ? (return_url.startsWith('http') ? return_url : `${reqOrigin}${return_url}`) : `${reqOrigin}/am/dashboard?tab=payments&tx_ref=${safeTxRef}`;

    // Demo Mode handling if CHAPA_SECRET_KEY is omitted
    if (!chapaSecretKey) {
      console.warn('[Chapa Init] CHAPA_SECRET_KEY is not defined. Returning demo checkout URL.');
      return NextResponse.json({
        status: 'success',
        message: 'Demo checkout initialized successfully',
        data: {
          checkout_url: `${validReturnUrl}${validReturnUrl.includes('?') ? '&' : '?'}status=success&tx_ref=${safeTxRef}`
        }
      });
    }

    // 7. Customization text sanitization (Chapa allows ONLY letters, numbers, hyphens, underscores, spaces, and dots)
    const defaultTitle = 'Beteseb Match';
    const defaultDesc = finalCurrency === 'USD' ? 'Beteseb Payment USD' : 'Beteseb Payment ETB';
    const customTitle = cleanCustomizationText(customization?.title, defaultTitle);
    const customDesc = cleanCustomizationText(customization?.description, defaultDesc);

    const payload = {
      amount: finalAmount,
      currency: finalCurrency,
      email: validEmail,
      first_name: validFirstName,
      last_name: validLastName,
      tx_ref: safeTxRef,
      callback_url: validCallbackUrl,
      return_url: validReturnUrl,
      ...(chapaSubAccountId && finalCurrency === 'ETB' ? { subaccount_id: chapaSubAccountId } : {}),
      customization: {
        title: customTitle,
        description: customDesc
      }
    };

    let response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let data = await response.json();

    // Retry once with a new unique retry tx_ref if initial request failed due to tx_ref collision
    if (data.status === 'failed' || !data.data?.checkout_url) {
      console.warn("[Chapa Init] Primary attempt failed. Retrying with fresh tx_ref...", data.message);
      const retryTxRef = `${safeTxRef.slice(0, 42)}-r${Math.random().toString(36).slice(-3)}`;
      const retryPayload = { ...payload, tx_ref: retryTxRef };

      response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(retryPayload)
      });

      data = await response.json();
    }

    if (data.status === 'failed' || !data.data?.checkout_url) {
      let errorMsg = 'Chapa initialization failed';
      if (typeof data.message === 'string') {
        errorMsg = data.message;
      } else if (data.message && typeof data.message === 'object') {
        errorMsg = Object.entries(data.message)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
          .join('; ');
      }

      // Format raw Laravel validation error strings into clean user-friendly messages
      errorMsg = errorMsg
        .replace(/validation\.min\.numeric/gi, 'The minimum transaction amount is 1.00')
        .replace(/validation\.required/gi, 'Required field missing');

      return NextResponse.json({ status: 'failed', message: errorMsg }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Chapa Init Error]:", error);
    return NextResponse.json(
      { status: 'failed', message: error?.message || 'Server error initializing Chapa payment' },
      { status: 500 }
    );
  }
}
