import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/products', '/shops']
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Role-based route protection
    const userRole = token.role as UserRole

    // Vendor routes
    if (pathname.startsWith('/vendor')) {
      if (userRole !== UserRole.VENDOR && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Customer routes
    if (pathname.startsWith('/orders') || pathname.startsWith('/profile')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes without token
        const { pathname } = req.nextUrl
        const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/products', '/shops']
        
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Require token for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}