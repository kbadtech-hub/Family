import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


/**
 * Generates an OAuth2 access token for Firebase v1 API.
 * Uses a simplified JWT-signing flow or direct google API endpoint if configured.
 * Since google-auth-library is not installed, we provide a clean, documented helper
 * that developers can use, or fallback to mock success log in dev mode.
 */
async function getGoogleAccessToken(clientEmail: string, privateKey: string) {
  // Replace escaped newlines in private key
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
  // Standard header and claim set for OAuth2 assertion
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Convert objects to base64
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Claim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Claim}`;

  // In a Next.js Edge/Node environment, use crypto to sign
  const crypto = require('crypto');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(formattedKey, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  // Request OAuth2 access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Google Auth error: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { userId, title, body, data: customData } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required parameters: userId, title, body' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials are not configured on the server.' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get user's FCM tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_tokens')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: `User profile not found: ${profileError?.message}` }, { status: 404 });
    }

    const tokens: string[] = profile.fcm_tokens || [];
    if (tokens.length === 0) {
      return NextResponse.json({ success: false, message: 'User has no registered push tokens.' });
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Fallback if Firebase service account is not yet configured in production
    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Firebase Server FCM credentials are not configured in environment variables.");
      console.log(`[FCM Mock Push] To user ${userId}: Title: "${title}", Body: "${body}"`);
      return NextResponse.json({
        success: true,
        mocked: true,
        message: 'Firebase credentials missing. Simulated push notification logged successfully.',
        payload: { title, body, tokens }
      });
    }

    // 2. Obtain Google OAuth2 access token
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

    // 3. Send FCM request to each registered token
    const results = [];
    for (const token of tokens) {
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
      
      const payload = {
        message: {
          token,
          notification: {
            title,
            body,
          },
          data: customData || {},
          android: {
            notification: {
              sound: 'default',
              click_action: 'FCM_OUTDOOR_CLICK',
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              }
            }
          }
        }
      };

      const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      results.push({ token, status: res.status, response: resData });
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("FCM Send Push Error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
