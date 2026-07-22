import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, refereeEmail, claimReason } = body as {
      userId: string;
      refereeEmail: string;
      claimReason: string;
    };

    if (!userId || !refereeEmail || !claimReason) {
      return NextResponse.json(
        { error: 'userId, refereeEmail, and claimReason are required' },
        { status: 400 }
      );
    }

    const { data: dispute, error } = await supabaseAdmin
      .from('referral_disputes')
      .insert({
        user_id: userId,
        referee_email: refereeEmail.trim().toLowerCase(),
        claim_reason: claimReason.trim(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Referral claim support request submitted successfully',
      dispute
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
