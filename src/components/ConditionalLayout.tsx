'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import TopHeader from './TopHeader';
import Footer from './Footer';
import AIChatbot from './AIChatbot';

// Pages that are purely internal/auth — no header, no footer
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

  // Check if the current path matches any no-chrome path segment
  const isNoChromeRoute = NO_CHROME_PATHS.some(p => pathname?.includes(p));

  return (
    <>
      {!isNoChromeRoute && (
        <>
          <TopHeader />
          <Header />
        </>
      )}
      <main className="flex-1">
        {children}
      </main>
      {!isNoChromeRoute && <Footer />}
      <AIChatbot />
    </>
  );
}
