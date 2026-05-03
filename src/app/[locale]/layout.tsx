import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Poppins, Noto_Sans_Ethiopic, Noto_Sans_Arabic} from "next/font/google";
import "@/app/globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import {UIProvider} from "@/context/UIContext";
import {AuthProvider} from "@/context/AuthContext";
import Chatbot from "@/components/Chatbot";
import SubscriptionObserver from "@/components/SubscriptionObserver";
import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
      <body className={`min-h-screen bg-white dark:bg-accent ${locale === 'ar' ? 'font-arabic' : 'font-sans'} flex flex-col transition-colors duration-500`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <UIProvider>
              <ConditionalLayout>
                {children}
                <Chatbot />
                <SubscriptionObserver />
              </ConditionalLayout>
            </UIProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
