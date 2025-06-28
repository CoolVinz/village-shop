import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/ui/navigation'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return {
    title: locale === 'th' 
      ? "ตลาดชาวบ้าน | Village Marketplace"
      : "Village Marketplace | ตลาดชาวบ้าน",
    description: locale === 'th'
      ? "ตลาดชุมชนออนไลน์สำหรับร้านค้าและสินค้าในหมู่บ้าน"
      : "Local marketplace for village shops and products",
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <Navigation />
        <main>{children}</main>
      </Providers>
    </NextIntlClientProvider>
  );
}