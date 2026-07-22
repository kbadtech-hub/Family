import { NextResponse } from 'next/server';
import { evaluateReferralTriggers, TriggerType } from '@/lib/referral-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refereeId, triggerType } = body as { refereeId: string; triggerType: TriggerType };

    if (!refereeId || !triggerType) {
      return NextResponse.json(
        { error: 'refereeId and triggerType are required' },
        { status: 400 }
      );
    }

    const result = await evaluateReferralTriggers(refereeId, triggerType);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
