import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma, connectWithRetry } from './prisma'
import { UserRole } from '@prisma/client'

// Extend NextAuth types for our custom user model
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      houseNumber: string
      role: UserRole
      lineId?: string
      phone?: string
      address?: string
    }
  }

  interface User {
    id: string
    name: string
    houseNumber: string
    role: UserRole
    lineId?: string
    phone?: string
    address?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    houseNumber: string
    role: UserRole
    lineId?: string
    phone?: string
    address?: string
  }
}

// Validate required environment variables
const requiredEnvVars = {
  LINE_CLIENT_ID: process.env.LINE_CLIENT_ID,
  LINE_CLIENT_SECRET: process.env.LINE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
}

// Log missing environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.warn(`⚠️ Missing environment variable: ${key}`)
  }
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // LINE Login provider - only add if credentials are available
    ...(process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET ? [{
      id: 'line',
      name: 'LINE',
      type: 'oauth' as const,
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
      authorization: {
        url: 'https://access.line.me/oauth2/v2.1/authorize',
        params: {
          scope: 'profile openid email',
          response_type: 'code',
        },
      },
      token: 'https://api.line.me/oauth2/v2.1/token',
      userinfo: 'https://api.line.me/v2/profile',
      profile(profile: { userId: string; displayName: string; email?: string; pictureUrl?: string }) {
        console.log('LINE profile:', profile) // Debug log
        return {
          id: profile.userId,
          name: profile.displayName,
          email: profile.email || `${profile.userId}@line.me`,
          image: profile.pictureUrl,
          lineId: profile.userId,
          houseNumber: '', // Will be collected during registration
          role: UserRole.CUSTOMER,
        }
      },
    }] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // For new logins, fetch user data from database
        const dbUser = await connectWithRetry(async () => {
          return await prisma.user.findUnique({
            where: { id: user.id }
          })
        })
        
        if (dbUser) {
          token.id = dbUser.id
          token.houseNumber = dbUser.houseNumber
          token.role = dbUser.role
          token.lineId = dbUser.lineId || undefined
          token.phone = dbUser.phone || undefined
          token.address = dbUser.address || undefined
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.houseNumber = token.houseNumber
        session.user.role = token.role
        session.user.lineId = token.lineId
        session.user.phone = token.phone
        session.user.address = token.address
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'line') {
        try {
          await connectWithRetry(async () => {
            // Check if user already exists in our database
            const existingUser = await prisma.user.findUnique({
              where: { lineId: user.lineId }
            })

            if (!existingUser) {
              // Create new user for first-time LINE login
              await prisma.user.create({
                data: {
                  id: user.id,
                  name: user.name || 'LINE User',
                  lineId: user.lineId,
                  houseNumber: '', // Will be collected later
                  phone: '',
                  address: '',
                  role: UserRole.CUSTOMER,
                  isActive: true
                }
              })
            }
          })
          return true
        } catch (error) {
          console.error('Error creating user:', error)
          return false
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper functions for role-based access control
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}

export function isVendor(userRole: UserRole): boolean {
  return userRole === UserRole.VENDOR
}

export function isCustomer(userRole: UserRole): boolean {
  return userRole === UserRole.CUSTOMER
}

export function canAccessVendorDashboard(userRole: UserRole): boolean {
  return userRole === UserRole.VENDOR || userRole === UserRole.ADMIN
}

export function canAccessAdminPanel(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}