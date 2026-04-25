'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import TopHeader from './TopHeader';
import Footer from './Footer';
import AIChatbot from './AIChatbot';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInternalPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/onboarding');

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
      <AIChatbot />
    </>
  );
}
