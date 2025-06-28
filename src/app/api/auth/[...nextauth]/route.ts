import NextAuth from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'

// NextAuth v4 App Router handler
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }