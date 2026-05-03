'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import TopHeader from './TopHeader';
import Footer from './Footer';
import AIChatbot from './AIChatbot';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInternalPage = pathname?.includes('/onboarding') || pathname?.includes('/secure-beteseb-admin');
  const hideHeader = pathname?.includes('/dashboard') || isInternalPage;

  return (
    <>
      {!hideHeader && (
        <>
          <TopHeader />
          <Header />
        </>
      )}
      <main className="flex-1">
        {children}
      </main>
      {!isInternalPage && <Footer />}
      <AIChatbot />
    </>
  );
}
