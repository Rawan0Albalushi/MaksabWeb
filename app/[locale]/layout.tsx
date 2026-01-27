import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Locale, locales, localeDirections } from '@/i18n/config';
import { Header, Footer, LocaleSync, ScrollToTop, NavigationProgress } from '@/components/layout';
import { AddressInitializer } from '@/components/address';
import '../globals.css';

export const metadata: Metadata = {
  title: 'مكسب - توصيل طلبات',
  description: 'منصة مكسب لتوصيل الطلبات من أفضل المتاجر والمطاعم',
  icons: {
    icon: '/favicon.ico',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = localeDirections[locale as Locale];

  return (
    <html lang={locale} dir={direction}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <NavigationProgress />
          <ScrollToTop />
          <LocaleSync />
          <AddressInitializer>
            <Header />
            <main className="flex-1 bg-[var(--black)]">{children}</main>
            <Footer />
          </AddressInitializer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

