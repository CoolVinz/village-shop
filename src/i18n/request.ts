import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This function is called for each request
  let locale = await requestLocale;

  // Ensure that the incoming `locale` is valid
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    onError(error) {
      // Log missing messages in development, suppress in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Missing translation:', error.message);
      }
    },
    getMessageFallback({ namespace, key }: { namespace?: string; key: string }) {
      const path = [namespace, key].filter((part) => part != null).join('.');
      
      // In production, return the key path as fallback
      if (process.env.NODE_ENV === 'production') {
        return path;
      }
      // In development, make it obvious what's missing
      return `[Missing: ${path}]`;
    }
  };
});