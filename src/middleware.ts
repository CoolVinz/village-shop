// TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
// import { withAuth } from 'next-auth/middleware'
// import { NextResponse } from 'next/server'
// import { UserRole } from '@prisma/client'

// Disabled middleware - allows access to all routes
export default function middleware() {
  // Allow all requests to pass through
  return undefined
}

// Comment out matcher to disable middleware completely
// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }