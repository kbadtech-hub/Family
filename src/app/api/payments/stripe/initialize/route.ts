import { NextResponse } from 'next/server';

// Stripe has been removed from Beteseb. Use Chapa (ETB) or PayPal (USD).
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe is not supported. Use Chapa for ETB or PayPal for USD payments.' },
    { status: 410 }
  );
}
