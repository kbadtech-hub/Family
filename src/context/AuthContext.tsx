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
