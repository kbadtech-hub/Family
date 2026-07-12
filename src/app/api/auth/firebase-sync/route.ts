/**
 * BETESEB — Firebase Social Auth Sync API Route
 * POST /api/auth/firebase-sync
 *
 * Flow:
 *  1. Client (Firebase Auth popup succeeds) sends Firebase ID token
 *  2. This server route verifies the token using Firebase Admin SDK
 *  3. Uses Supabase SERVICE ROLE key to upsert user into auth.users + profiles
 *     (Service role bypasses RLS and FK constraints safely)
 *  4. Returns { isNewUser, profileId } to the client
 *
 * WHY SERVER-SIDE?
 *  - profiles.id has FK → auth.users. Only service role can insert into auth.users.
 *  - Firebase UIDs don't exist in Supabase auth.users, so client-side insert fails.
 *  - Server-side admin client resolves this cleanly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

// ─── Firebase Admin SDK (singleton) ──────────────────────────────────────────

function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

// ─── Supabase Admin Client (service role — bypasses RLS) ─────────────────────

function getSupabaseAdmin() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!roleKey || roleKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local');
  }

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
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    // Step 1: Verify the Firebase ID token server-side
    const adminApp  = getFirebaseAdmin();
    const adminAuth = getAuth(adminApp);

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired Firebase token' }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;
    const supabaseUid = firebaseUidToUuid(firebaseUid);
    const email       = decodedToken.email       || '';
    const phone       = decodedToken.phone       || '';
    const fullName    = decodedToken.name         || '';
    const avatarUrl   = decodedToken.picture      || '';

    // Generate a secure derived password that only our server can compute.
    // We use Node's crypto to create a secure SHA-256 HMAC of the UID salted with the service role key.
    const derivedPassword = crypto
      .createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .update(firebaseUid)
      .digest('hex');

    // Use a unique dummy email for phone-only users to satisfy Supabase auth constraints
    const loginEmail = email || `${firebaseUid}@beteseb.auth`;

    // Step 2: Use Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Step 3: Check if user already exists in Supabase auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserById(supabaseUid);

    if (!existingAuthUser?.user) {
      // Create a new Supabase auth user with the same UID as Firebase
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        id:             supabaseUid,       // Use derived UUID as Supabase UID
        email:          loginEmail,
        password:       derivedPassword,   // Set the derived secure password
        email_confirm:  true,              // Auto-confirm social login emails
        user_metadata: {
          full_name:   fullName,
          avatar_url:  avatarUrl,
          provider:    'firebase_social',
        },
      });

      if (createError && createError.message !== 'User already registered') {
        console.error('[firebase-sync] Auth user creation error:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    } else {
      // If user exists but might have had a different password structure, update it to match the derived one
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUid, {
        password: derivedPassword,
        email: loginEmail
      });
      if (updateError) {
        console.error('[firebase-sync] Auth user update error:', updateError);
      }
    }

    // Step 4: Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, onboarding_completed, phone')
      .eq('id', supabaseUid)
      .maybeSingle();

    let isNewUser = false;
    let hasPhone = !!phone;

    if (existingProfile) {
      hasPhone = !!existingProfile.phone;
      
      // Update last login and phone if verified in Firebase now but missing in profiles
      const updateData: any = { last_login_at: new Date().toISOString() };
      if (!existingProfile.phone && phone) {
        updateData.phone = phone;
        hasPhone = true;
      }

      await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', supabaseUid);

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
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      isNewUser = true;
    }

    // Return the login credentials so the client-side Supabase client can authenticate
    return NextResponse.json({
      success: true,
      isNewUser,
      hasPhone,
      profileId: supabaseUid,
      loginEmail,
      derivedPassword
    });

  } catch (err: any) {
    console.error('[firebase-sync] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
