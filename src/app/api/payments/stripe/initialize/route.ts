import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Stripe gateway is disabled. All domestic and international payments are processed exclusively via Chapa.' },
    { status: 400 }
  );
}
