import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Poppins, Noto_Sans_Ethiopic, Noto_Sans_Arabic} from "next/font/google";
import type { Viewport } from 'next';
import "@/app/globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import {UIProvider} from "@/context/UIContext";
import {AuthProvider} from "@/context/AuthContext";
import Chatbot from "@/components/Chatbot";
import SubscriptionObserver from "@/components/SubscriptionObserver";
import AnimatedSplashScreen from "@/components/AnimatedSplashScreen";
import ZoomBlocker from "@/components/ZoomBlocker";
import PrivacyBlurOverlay from "@/components/PrivacyBlurOverlay";
import AppLockGate from "@/components/AppLockGate";
import FirebaseProvider from "@/components/FirebaseProvider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};


export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} className={`${poppins.variable} ${notoEthiopic.variable} ${notoArabic.variable} antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#FF6B6B" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4519221650297297"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`min-h-screen bg-white dark:bg-accent ${locale === 'ar' ? 'font-arabic' : 'font-sans'} flex flex-col transition-colors duration-500`}>
        <NextIntlClientProvider messages={messages}>
          <FirebaseProvider>
          <AuthProvider>
            <UIProvider>
              <AppLockGate>
              <ConditionalLayout>
                {children}
                <Chatbot />
                <SubscriptionObserver />
                <AnimatedSplashScreen />
                <ZoomBlocker />
                <PrivacyBlurOverlay />
              </ConditionalLayout>
              </AppLockGate>
            </UIProvider>
          </AuthProvider>
          </FirebaseProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
