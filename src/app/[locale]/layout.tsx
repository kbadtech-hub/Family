import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Poppins, Noto_Sans_Ethiopic} from "next/font/google";
import "@/app/globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import {UIProvider} from "@/context/UIContext";

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
    <html lang={locale} dir={direction} className={`${poppins.variable} ${notoEthiopic.variable} antialiased`}>
      <body className="min-h-screen bg-white dark:bg-accent font-sans flex flex-col transition-colors duration-500">
        <NextIntlClientProvider messages={messages}>
          <UIProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </UIProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
