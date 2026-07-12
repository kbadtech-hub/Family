import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

// ─── Firebase Admin SDK (singleton) ──────────────────────────────────────────

function getFirebaseAdmin(projectId: string, clientEmail: string, privateKey: string) {
  if (getApps().length > 0) return getApps()[0];

  const formattedPrivateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
  });
}

// ─── Supabase Admin Client (service role — bypasses RLS) ─────────────────────

function getSupabaseAdmin(url: string, roleKey: string) {
  return createClient(url, roleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// Helper to derive a valid UUID v3 deterministically from a Firebase alphanumeric UID
function firebaseUidToUuid(uid: string): string {
  const hash = crypto.createHash('md5').update(uid).digest('hex');
  const part1 = hash.substring(0, 8);
  const part2 = hash.substring(8, 12);
  const part3 = '3' + hash.substring(13, 16); // Version 3
  const part4 = 'a' + hash.substring(17, 20); // Variant
  const part5 = hash.substring(20, 32);
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

// ─── GET Diagnostic Handler ───────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Beteseb Auth Sync API is operational',
    timestamp: new Date().toISOString(),
    environment: {
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Strict Validation of Environment variables before initializing SDKs
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
    const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin credentials are not configured in server environment variables.'
      }, { status: 500 });
    }

    if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE') {
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials are not configured in server environment variables.'
      }, { status: 500 });
    }

    // 2. Parse request payload
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be a valid JSON object.' }, { status: 400 });
    }

    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'idToken is required.' }, { status: 400 });
    }

    // 3. Verify Firebase ID Token
    let adminApp;
    let adminAuth;
    try {
      adminApp = getFirebaseAdmin(firebaseProjectId, firebaseClientEmail, firebasePrivateKey);
      adminAuth = getAuth(adminApp);
    } catch (firebaseInitError: any) {
      console.error('[firebase-sync] Firebase Admin initialization failed:', firebaseInitError);
      return NextResponse.json({ success: false, error: `Firebase Admin initialization failed: ${firebaseInitError.message}` }, { status: 500 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenVerifyError: any) {
      console.error('[firebase-sync] Token verification failed:', tokenVerifyError);
      return NextResponse.json({ success: false, error: `Invalid or expired Firebase token: ${tokenVerifyError.message}` }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;
    const supabaseUid = firebaseUidToUuid(firebaseUid);
    const email       = decodedToken.email       || '';
    const phone       = decodedToken.phone       || '';
    const fullName    = decodedToken.name         || '';
    const avatarUrl   = decodedToken.picture      || '';

    // Generate a secure derived password that only our server can compute.
    const derivedPassword = crypto
      .createHmac('sha256', supabaseServiceKey)
      .update(firebaseUid)
      .digest('hex');

    // Use a unique dummy email for phone-only users to satisfy Supabase auth constraints
    const loginEmail = email || `${firebaseUid}@beteseb.auth`;

    // 4. Initialize Supabase Admin client
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin(supabaseUrl, supabaseServiceKey);
    } catch (supabaseInitError: any) {
      console.error('[firebase-sync] Supabase Admin initialization failed:', supabaseInitError);
      return NextResponse.json({ success: false, error: `Supabase Admin client creation failed: ${supabaseInitError.message}` }, { status: 500 });
    }

    // 5. Query / Create Supabase Auth User
    let existingAuthUser;
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserById(supabaseUid);
      existingAuthUser = data;
    } catch (getUserError: any) {
      console.warn('[firebase-sync] getUserById threw exception, treating user as non-existent:', getUserError);
      existingAuthUser = null;
    }

    if (!existingAuthUser?.user) {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        id:             supabaseUid,
        email:          loginEmail,
        password:       derivedPassword,
        email_confirm:  true,
        user_metadata: {
          full_name:   fullName,
          avatar_url:  avatarUrl,
          provider:    'firebase_social',
        },
      });

      if (createError && createError.message !== 'User already registered') {
        console.error('[firebase-sync] Auth user creation error:', createError);
        return NextResponse.json({ success: false, error: `Supabase auth user creation failed: ${createError.message}` }, { status: 500 });
      }
    } else {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUid, {
        password: derivedPassword,
        email: loginEmail
      });
      if (updateError) {
        console.warn('[firebase-sync] Auth user update error:', updateError);
      }
    }

    // 6. Query / Create Supabase User Profile
    const { data: existingProfile, error: profileSelectError } = await supabaseAdmin
      .from('profiles')
      .select('id, onboarding_completed, phone')
      .eq('id', supabaseUid)
      .maybeSingle();

    if (profileSelectError) {
      console.error('[firebase-sync] Profile select error:', profileSelectError);
      return NextResponse.json({ success: false, error: `Supabase profile lookup failed: ${profileSelectError.message}` }, { status: 500 });
    }

    let isNewUser = false;
    let hasPhone = !!phone;

    if (existingProfile) {
      hasPhone = !!existingProfile.phone;
      
      const updateData: any = { last_login_at: new Date().toISOString() };
      if (!existingProfile.phone && phone) {
        updateData.phone = phone;
        hasPhone = true;
      }

      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', supabaseUid);

      if (profileUpdateError) {
        console.warn('[firebase-sync] Profile update error:', profileUpdateError);
      }

      isNewUser = !existingProfile.onboarding_completed;
    } else {
      // New user — create their profile
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id:                   supabaseUid,
          email:                loginEmail,
          phone:                phone || null,
          full_name:            fullName,
          avatar_url:           avatarUrl,
          onboarding_step:      1,
          onboarding_completed: false,
          created_at:           new Date().toISOString(),
          updated_at:           new Date().toISOString(),
        });

      if (insertError) {
        console.error('[firebase-sync] Profile insert error:', insertError);
        return NextResponse.json({ success: false, error: `Supabase profile insertion failed: ${insertError.message}` }, { status: 500 });
      }

      isNewUser = true;
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      hasPhone,
      profileId: supabaseUid,
      loginEmail,
      derivedPassword
    });

  } catch (err: any) {
    console.error('[firebase-sync] Uncaught exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
