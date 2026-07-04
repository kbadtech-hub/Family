import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Create supabase client with the user's JWT token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Call the security-definer PostgreSQL RPC function to delete account
    const { error } = await supabase.rpc('delete_own_user_account');

    if (error) {
      console.error('Delete account RPC error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });

  } catch (error: any) {
    console.error('Delete account API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
