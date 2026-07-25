'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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
    // 1. Get initial session with try-catch-finally protection
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] Session retrieval error, clearing corrupted tokens:', error);
          clearAuthStorage();
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('[AuthContext] Unhandled auth init error, clearing auth storage:', err);
        clearAuthStorage();
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Helper to safely purge corrupted auth tokens from storage
    function clearAuthStorage() {
      if (typeof window === 'undefined') return;
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
      } catch (_) {}
    }

    // 3. Listen to native deep links (Google/Facebook/Apple OAuth redirects)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const initDeepLinking = async () => {
        try {
          const { App } = await import('@capacitor/app');
          App.addListener('appUrlOpen', async (data: any) => {
            try {
              console.log('[DeepLink] App opened with URL:', data?.url);
              const urlStr = data?.url;
              if (!urlStr) return;

              // Prevent infinite loop by checking if we already processed this exact URL
              if ((window as any)._lastProcessedDeepLink === urlStr) return;
              (window as any)._lastProcessedDeepLink = urlStr;

              // Handle Firebase OAuth redirect handlers
              if (urlStr.includes('__/auth') || urlStr.includes('__/__/auth')) {
                const webUrl = urlStr.replace('com.beteseb.app://', 'https://beteseb1.online/');
                if (window.location.href !== webUrl) {
                  window.location.href = webUrl;
                }
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
                    }).catch((err) => console.error('[DeepLink] setSession error:', err));

                    if (!window.location.pathname.includes('/dashboard')) {
                      window.location.href = '/dashboard';
                    }
                  }
                }
              }
            } catch (deepLinkErr) {
              console.error('[DeepLink] Error handling URL open:', deepLinkErr);
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
      try {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (_event === 'SIGNED_IN' && session?.user) {
          // Lazy-load Firebase services only when a user actually signs in
          import('@/lib/firebase-analytics').then(({ trackLogin, setUserProperties }) => {
            trackLogin('email').catch(() => {});
            setUserProperties(session.user.id, 'free', session.user.user_metadata?.country || 'ET').catch(() => {});
          }).catch(() => {});

          import('@/lib/firebase-crashlytics').then(({ setCrashlyticsUser }) => {
            setCrashlyticsUser(session.user.id).catch(() => {});
          }).catch(() => {});

        } else if (_event === 'SIGNED_OUT') {
          // Lazy-load and clean up FCM tokens on logout
          import('@/lib/push-notifications').then(({ unregisterPushNotifications }) => {
            unregisterPushNotifications().catch(() => {});
          }).catch(() => {});
        }
      } catch (authChangeErr) {
        console.error('[AuthContext] Error inside onAuthStateChange listener:', authChangeErr);
        setIsLoading(false);
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
