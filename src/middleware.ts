import { withAuth } from 'next-auth/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export default withAuth(
  function onSuccess(req) {
    return intlMiddleware(req)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public paths
        if (
          pathname.includes('/api/auth') ||
          pathname === '/' ||
          pathname.startsWith('/en') && pathname === '/en' ||
          pathname.startsWith('/th') && pathname === '/th' ||
          pathname.includes('/auth/') ||
          pathname.includes('/products') ||
          pathname.includes('/shops') ||
          pathname.includes('/_next') ||
          pathname.includes('/favicon.ico')
        ) {
          return true
        }
        
        // Require authentication for protected routes
        if (
          pathname.includes('/vendor') ||
          pathname.includes('/admin') ||
          pathname.includes('/orders') ||
          pathname.includes('/checkout')
        ) {
          if (!token) return false
          
          // Role-based access control
          if (pathname.includes('/vendor')) {
            return token.role === 'VENDOR' || token.role === 'ADMIN'
          }
          
          if (pathname.includes('/admin')) {
            return token.role === 'ADMIN'
          }
          
          if (pathname.includes('/orders') || pathname.includes('/checkout')) {
            return token.role === 'CUSTOMER' || token.role === 'VENDOR' || token.role === 'ADMIN'
          }
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/', '/(th|en)/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)']
}