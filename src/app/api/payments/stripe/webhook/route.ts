import { NextResponse } from 'next/server';

// Stripe has been removed from Beteseb.
export async function POST() {
  return NextResponse.json({ received: true });
}
