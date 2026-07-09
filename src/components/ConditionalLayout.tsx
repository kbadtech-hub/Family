'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import TopHeader from './TopHeader';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInternalPage = 
    pathname?.includes('/dashboard') || 
    pathname?.includes('/onboarding') || 
    pathname?.includes('/secure-beteseb-admin') ||
    pathname?.includes('/login') ||
    pathname?.includes('/signup') ||
    pathname?.includes('/forgot-password') ||
    pathname?.includes('/academy') ||
    // Use exact segment match so /community-hub is NOT caught here
    pathname?.match(/\/community(\/|$)/) !== null ||
    pathname?.includes('/profile') ||
    pathname?.includes('/chat') ||
    pathname?.includes('/settings') ||
    pathname?.includes('/auth/');

  return (
    <>
      {!isInternalPage && (
        <>
          <TopHeader />
          <Header />
        </>
      )}
      <main className="flex-1">
        {children}
      </main>
      {!isInternalPage && <Footer />}
    </>
  );
}
