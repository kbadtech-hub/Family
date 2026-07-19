import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, email, first_name, last_name, tx_ref, callback_url, return_url } = await req.json();

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    const chapaSubAccountId = process.env.CHAPA_SUBACCOUNT_ID;

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
        email,
        first_name,
        last_name,
        tx_ref,
        callback_url,
        return_url,
        ...(chapaSubAccountId ? { subaccount_id: chapaSubAccountId } : {}),
        customization: {
          title: "Beteseb Matchmaking Premium",
          description: "Payment for Beteseb Matchmaking Premium Plan"
        }
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Chapa Initialization Error:", error);
    return NextResponse.json({ status: 'failed', message: error.message }, { status: 500 });
  }
}
