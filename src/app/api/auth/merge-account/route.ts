import { NextRequest, NextResponse } from 'next/server';
import { mergeUserAccounts } from '@/lib/duplicate/merger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { primaryUserId, secondaryUserId, performedByUserId, reason } = body;

    if (!primaryUserId || !secondaryUserId) {
      return NextResponse.json(
        { error: 'primaryUserId and secondaryUserId are required.' },
        { status: 400 }
      );
    }

    const result = await mergeUserAccounts({
      primaryUserId,
      secondaryUserId,
      performedByUserId,
      reason,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in merge-account API route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge accounts' },
      { status: 500 }
    );
  }
}
