import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, locale } = await req.json();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('user_otps')
      .upsert({ 
        email, 
        code: otp, 
        expires_at: expiresAt.toISOString() 
      }, { onConflict: 'email' });

    if (dbError) throw dbError;

    // Send email via Resend
    const subject = locale === 'am' ? 'የቤተሰብ ማረጋገጫ ኮድ' : 'Beteseb Verification Code';
    const body = locale === 'am' 
      ? `የእርስዎ የማረጋገጫ ኮድ፡ ${otp} ነው። ይህ ኮድ ለ10 ደቂቃዎች ብቻ ያገለግላል።` 
      : `Your verification code is: ${otp}. This code will expire in 10 minutes.`;

    const { data, error: mailError } = await resend.emails.send({
      from: 'Beteseb <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #FF5A5F; text-align: center;">Beteseb</h2>
        <p style="font-size: 16px; color: #333;">${body}</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 10px; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
          ${locale === 'am' ? 'ይህንን ኮድ ለማንም አያጋሩ።' : 'Do not share this code with anyone.'}
        </p>
      </div>`,
    });

    if (mailError) throw mailError;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
