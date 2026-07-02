import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    // Validate user session using the JWT token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Delete profile avatar photos from storage
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        const filePaths = avatarFiles.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from('avatars').remove(filePaths);
      }
    } catch (storageErr) {
      console.error('Storage avatars cleanup error:', storageErr);
    }

    // 2. Delete gallery photos from storage
    try {
      const { data: galleryFiles } = await supabaseAdmin.storage
        .from('gallery')
        .list(userId);
      if (galleryFiles && galleryFiles.length > 0) {
        const filePaths = galleryFiles.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from('gallery').remove(filePaths);
      }
    } catch (storageErr) {
      console.error('Storage gallery cleanup error:', storageErr);
    }

    // 3. Purge DB data linked to the user
    const dbTables = [
      'messages',
      'friendships',
      'post_reactions',
      'post_comments',
      'community_posts',
      'guardians',
      'subscriptions',
    ];

    for (const table of dbTables) {
      try {
        await supabaseAdmin
          .from(table)
          .delete()
          .or(`user_id.eq.${userId},author_id.eq.${userId},sender_id.eq.${userId},receiver_id.eq.${userId}`);
      } catch (tableErr) {
        console.error(`Failed deleting user from table ${table}:`, tableErr);
      }
    }

    // 4. Delete the profile record itself
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 5. Delete user from auth (admin function)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return NextResponse.json({ error: `Auth deletion failed: ${authDeleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account successfully deleted' });
  } catch (error: any) {
    console.error('Account delete API handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
