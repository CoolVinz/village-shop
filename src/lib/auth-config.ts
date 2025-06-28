/* eslint-disable @typescript-eslint/no-explicit-any */
import LineProvider from 'next-auth/providers/line'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'profile openid email',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      console.log('🔑 LINE Login attempt:', { 
        userId: user.id, 
        email: user.email, 
        provider: account?.provider 
      })
      
      if (account?.provider === 'line') {
        try {
          // Check if user exists in our system
          const existingUser = await prisma.user.findUnique({
            where: { lineId: account.providerAccountId },
          })

          if (!existingUser) {
            // Create new user with LINE profile data
            const newUser = await prisma.user.create({
              data: {
                name: user.name || 'LINE User',
                email: user.email,
                image: user.image,
                lineId: account.providerAccountId,
                role: 'CUSTOMER',
                profileComplete: false, // Will redirect to complete profile
              },
            })
            console.log('✅ Created new LINE user:', newUser.id)
          } else {
            // Update existing user profile with latest LINE data
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                email: user.email || existingUser.email,
                image: user.image || existingUser.image,
              },
            })
            console.log('✅ Updated existing LINE user:', existingUser.id)
          }
        } catch (error) {
          console.error('❌ Error handling LINE login:', error)
          return false
        }
      }
      
      return true
    },
    
    async session({ session, user }: any) {
      if (session.user) {
        // Fetch complete user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            houseNumber: true,
            phone: true,
            profileComplete: true,
            lineId: true,
          },
        })

        if (dbUser) {
          session.user = {
            ...session.user,
            id: dbUser.id,
            role: dbUser.role,
            houseNumber: dbUser.houseNumber,
            phone: dbUser.phone,
            profileComplete: dbUser.profileComplete,
            lineId: dbUser.lineId,
          }
        }
      }
      
      return session
    },
    
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
        token.houseNumber = user.houseNumber
        token.profileComplete = user.profileComplete
      }
      return token
    },
  },
  
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/complete-profile', // Redirect new users here
    error: '/auth/error',
  },
  
  events: {
    async signIn({ user, account, isNewUser }: any) {
      console.log('📝 User signed in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      })
    },
    async createUser({ user }: any) {
      console.log('👤 New user created:', {
        userId: user.id,
        email: user.email,
      })
    },
  },
  
  session: {
    strategy: 'database' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
}