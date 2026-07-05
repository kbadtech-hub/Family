import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Mock SMS Dispatch Gateway API endpoint.
 * This endpoint simulates sending the message to a third-party gateway (like Yenepay or Twilio)
 * and updates the database queue record to 'sent' or 'failed'.
 */
export async function POST(req: Request) {
  try {
    const { smsId } = await req.json();

    if (!smsId) {
      // Fallback: process first 10 pending SMS records
      const { data: pending, error: fetchError } = await supabase
        .from('sms_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(10);

      if (fetchError || !pending) {
        return NextResponse.json({ success: false, error: fetchError?.message || 'No pending SMS found' });
      }

      for (const sms of pending) {
        console.log(`[SMS SIMULATION] Dispatching to ${sms.recipient_phone}: "${sms.message_content}"`);
        await supabase
          .from('sms_queue')
          .update({ status: 'sent' })
          .eq('id', sms.id);
      }

      return NextResponse.json({ success: true, processed: pending.length });
    }

    // Process specific smsId
    const { data: sms, error: fetchError } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('id', smsId)
      .single();

    if (fetchError || !sms) {
      return NextResponse.json({ success: false, error: 'SMS task not found' }, { status: 404 });
    }

    console.log(`[SMS SIMULATION] Dispatching to ${sms.recipient_phone}: "${sms.message_content}"`);
    
    const { error: updateError } = await supabase
      .from('sms_queue')
      .update({ status: 'sent' })
      .eq('id', smsId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'SMS sent successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sms_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ success: true, queue: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
