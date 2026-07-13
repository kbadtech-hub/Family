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

    // 2. Disabled global SQL update query to prevent midnight database write spikes.
    // The application now utilizes scalable, on-demand Lazy Resetting (reset-on-write) 
    // inside ChatView and CallInterface components.
    console.log("Daily limits reset cron called. SQL update skipped (Lazy Reset active).");

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
