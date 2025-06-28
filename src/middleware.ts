import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'th'],
  
  // Used when no locale matches
  defaultLocale: 'th', // Default to Thai for Thai users
  
  // Use cookie for locale persistence
  localeDetection: true,
  
  // Prefix for locale in URL
  localePrefix: 'as-needed' // Only add prefix for non-default locale
});

export const config = {
  // Match only internationalized pathnames, exclude API routes
  matcher: ['/', '/(th|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};