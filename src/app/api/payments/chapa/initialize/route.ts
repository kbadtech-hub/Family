import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, email, first_name, last_name, tx_ref, callback_url, return_url } = await req.json();

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    const chapaSubAccountId = process.env.CHAPA_SUBACCOUNT_ID;

    // Ensure email is valid and never causes Chapa email validation error
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = (email && typeof email === 'string' && emailRegex.test(email.trim()) && !email.includes('example.com'))
      ? email.trim()
      : `user_${(tx_ref || Date.now()).toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}@beteseb1.online`;

    if (!chapaSecretKey) {
      console.warn("CHAPA_SECRET_KEY is not defined. Returning demo checkout URL.");
      return NextResponse.json({
        status: 'success',
        message: 'Demo checkout initialized successfully',
        data: {
          checkout_url: `${return_url || callback_url}?status=success&tx_ref=${tx_ref}`
        }
      });
    }

    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency: 'ETB',
        email: validEmail,
        first_name: first_name || 'Beteseb',
        last_name: last_name || 'Member',
        tx_ref,
        callback_url,
        return_url,
        ...(chapaSubAccountId ? { subaccount_id: chapaSubAccountId } : {}),
        customization: {
          title: "Beteseb Matchmaking",
          description: "Payment for Beteseb Services"
        }
      })
    });

    const data = await response.json();

    if (data.status === 'failed' || !data.data?.checkout_url) {
      let errorMsg = 'Chapa initialization failed';
      if (typeof data.message === 'string') {
        errorMsg = data.message;
      } else if (data.message && typeof data.message === 'object') {
        errorMsg = Object.entries(data.message)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
          .join('; ');
      }
      return NextResponse.json({ status: 'failed', message: errorMsg }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Chapa Initialization Error:", error);
    return NextResponse.json({ status: 'failed', message: error?.message || 'Server error initializing payment' }, { status: 500 });
  }
}
