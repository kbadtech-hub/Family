import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization check for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Perform global reset of limits
    const { data, error } = await supabaseAdmin
      .from('daily_limits')
      .update({
        messages_sent: 0,
        calls_duration_seconds: 0,
        ad_extensions: 0,
        last_reset: new Date().toISOString()
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // matches all user_ids

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Daily limit counters reset successfully.',
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('Error running daily limits reset cron:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
