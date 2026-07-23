'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { setUserProperties, trackLogin } from '@/lib/firebase-analytics';
import { setCrashlyticsUser } from '@/lib/firebase-crashlytics';
import { unregisterPushNotifications } from '@/lib/push-notifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    initAuth();

    // 3. Listen to native deep links (Google/Facebook/Apple OAuth redirects)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const initDeepLinking = async () => {
        try {
          const { App } = await import('@capacitor/app');
          App.addListener('appUrlOpen', async (data: any) => {
            console.log('[DeepLink] App opened with URL:', data.url);
            const urlStr = data.url;
            if (urlStr) {
              // Handle Firebase OAuth redirect handlers
              if (urlStr.includes('__/auth') || urlStr.includes('__/__/auth')) {
                const webUrl = urlStr.replace('com.beteseb.app://', 'https://beteseb1.online/');
                window.location.href = webUrl;
              }
              // Handle direct Supabase OAuth callbacks
              else if (urlStr.includes('auth-callback')) {
                const hashIndex = urlStr.indexOf('#');
                if (hashIndex !== -1) {
                  const hash = urlStr.substring(hashIndex + 1);
                  const params = new URLSearchParams(hash);
                  const accessToken = params.get('access_token');
                  const refreshToken = params.get('refresh_token');
                  if (accessToken && refreshToken) {
                    await supabase.auth.setSession({
                      access_token: accessToken,
                      refresh_token: refreshToken
                    });
                    // Force redirect to dashboard
                    window.location.href = '/dashboard';
                  }
                }
              }
            }
          });
        } catch (e) {
          console.error('[DeepLink] Failed to initialize native deep links:', e);
        }
      };
      initDeepLinking();
    }

    // 2. Listen for auth changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (_event === 'SIGNED_IN' && session?.user) {
        // Track login in Firebase Analytics
        trackLogin('email').catch(() => {});
        // Set user identity in Crashlytics
        setCrashlyticsUser(session.user.id).catch(() => {});
        // Set user properties for segmentation
        setUserProperties(session.user.id, 'free', session.user.user_metadata?.country || 'ET').catch(() => {});
      } else if (_event === 'SIGNED_OUT') {
        // Clean up FCM tokens on logout
        unregisterPushNotifications().catch(() => {});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
