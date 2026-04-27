import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Basic security: Check for Vercel Cron header or a secret
  // In production, you'd set CRON_SECRET in your environment variables
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { error } = await supabase.rpc('generate_ai_community_topic');
    
    if (error) {
      console.error('Error generating AI topic:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'AI topic generated successfully' });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
