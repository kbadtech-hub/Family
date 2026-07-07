/**
 * BETESEB FCM PUSH NOTIFICATION SERVER-SIDE API
 * POST /api/notifications/push
 * Sends targeted push notifications via Firebase Admin SDK (FCM v1).
 * Called server-side when events happen (new message, match, payment approved, etc.)
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// FCM v1 API endpoint
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`;

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Get Google OAuth2 access token for FCM v1 API
 * Uses service account credentials from environment variables
 */
async function getFCMAccessToken(): Promise<string | null> {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.error('[FCM Server] Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY');
    return null;
  }

  try {
    // Build JWT for Google OAuth2
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');

    const unsigned = `${encode(header)}.${encode(payload)}`;

    // Sign JWT with RS256 (using Node.js crypto)
    const { createSign } = await import('crypto');
    const signer = createSign('RSA-SHA256');
    signer.update(unsigned);
    const signature = signer.sign(privateKey, 'base64url');
    const jwt = `${unsigned}.${signature}`;

    // Exchange JWT for OAuth2 access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (e: any) {
    console.error('[FCM Server] Failed to get access token:', e.message);
    return null;
  }
}

/**
 * Send a push notification to a single FCM token
 */
async function sendToToken(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string,
  accessToken?: string
): Promise<boolean> {
  if (!accessToken) return false;

  const message: any = {
    token,
    notification: { title, body, ...(imageUrl ? { image: imageUrl } : {}) },
    data: data || {},
    android: {
      notification: {
        channelId: 'beteseb_default',
        priority: 'HIGH',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  const res = await fetch(FCM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.warn(`[FCM Server] Send to token failed: ${JSON.stringify(err)}`);
    return false;
  }

  return true;
}

// ── POST Handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body: NotificationPayload = await req.json();
    const { userId, title, body: bodyText, data, imageUrl } = body;

    if (!userId || !title || !bodyText) {
      return NextResponse.json(
        { status: 'error', message: 'Missing userId, title, or body' },
        { status: 400 }
      );
    }

    // 1. Fetch user FCM tokens from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('fcm_tokens')
      .eq('id', userId)
      .single();

    if (error || !profile?.fcm_tokens?.length) {
      return NextResponse.json(
        { status: 'skipped', message: 'No FCM tokens registered for user' },
        { status: 200 }
      );
    }

    const tokens: string[] = profile.fcm_tokens;

    // 2. Get FCM access token
    const accessToken = await getFCMAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { status: 'error', message: 'Could not get FCM access token — check Firebase service account env vars' },
        { status: 500 }
      );
    }

    // 3. Send to all registered tokens
    const results = await Promise.allSettled(
      tokens.map(token => sendToToken(token, title, bodyText, data, imageUrl, accessToken))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - sent;

    console.log(`[FCM Server] Sent ${sent}/${tokens.length} notifications to user ${userId}`);

    return NextResponse.json({
      status: 'success',
      sent,
      failed,
      total: tokens.length,
    });
  } catch (e: any) {
    console.error('[FCM Server] Unexpected error:', e);
    return NextResponse.json({ status: 'failed', message: e.message }, { status: 500 });
  }
}
