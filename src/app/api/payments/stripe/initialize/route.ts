import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, email, planType, userId, successUrl, cancelUrl } = await req.json();

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = (email && typeof email === 'string' && emailRegex.test(email.trim()) && !email.includes('example.com'))
      ? email.trim()
      : `user_${(userId || Date.now()).toString().slice(0, 15)}@beteseb1.online`;

    if (!stripeSecretKey) {
      console.warn("STRIPE_SECRET_KEY is not defined. Returning demo checkout URL.");
      return NextResponse.json({
        id: 'demo_session',
        url: `${successUrl}?session_id=demo_session&userId=${userId}&planType=${planType}&amount=${amount}`
      });
    }

    // Direct REST API call to Stripe (avoids requiring standard stripe NPM module dependency)
    const params = new URLSearchParams();
    params.append('payment_method_types[0]', 'card');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Beteseb Premium - ${planType}`);
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100))); // in cents
    params.append('line_items[0][quantity]', '1');
    params.append('mode', 'payment');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('customer_email', validEmail);
    params.append('metadata[userId]', userId);
    params.append('metadata[planType]', planType);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    if (data.error) {
      const errMsg = typeof data.error === 'string' 
        ? data.error 
        : (data.error.message || JSON.stringify(data.error));
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Stripe Session Initialization Error:", error);
    return NextResponse.json({ error: error?.message || 'Stripe initialization failed' }, { status: 500 });
  }
}
