'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import TopHeader from './TopHeader';
import Footer from './Footer';
import AIChatbot from './AIChatbot';
import { useAuth } from '@/context/AuthContext';

// Pages that always hide header/footer regardless of auth (auth flow pages)
const NO_CHROME_PATHS = [
  '/dashboard',
  '/onboarding',
  '/secure-beteseb-admin',
  '/admin',
  '/login',
  '/signup',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/counseling-session',
  '/guardian',
  '/vouch',
  '/location-selection',
];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Hide chrome on specific auth/internal paths
  const isNoChromeRoute = NO_CHROME_PATHS.some(p => pathname?.includes(p));

  // Also hide chrome if user is logged in — they are inside the app
  const isLoggedIn = !isLoading && !!user;

  const showChrome = !isNoChromeRoute && !isLoggedIn;

  return (
    <>
      {showChrome && (
        <>
          <TopHeader />
          <Header />
        </>
      )}
      <main className="flex-1">
        {children}
      </main>
      {showChrome && <Footer />}
      <AIChatbot />
    </>
  );
}
