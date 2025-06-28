'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
  houseNumber?: string | null
  phone?: string | null
  profileComplete: boolean
  lineId?: string | null
}

interface ExtendedSession {
  user: ExtendedUser
}

export function useNextAuth() {
  const { data: rawSession, status } = useSession()
  const session = rawSession as ExtendedSession | null
  const router = useRouter()

  const loginWithLine = async () => {
    try {
      await signIn('line', { 
        callbackUrl: '/auth/complete-profile',
        redirect: false 
      })
    } catch (error) {
      console.error('LINE login error:', error)
      throw new Error('Failed to login with LINE')
    }
  }

  const logout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: false 
      })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const completeProfile = async (profileData: {
    houseNumber: string
    phone?: string
    role?: 'CUSTOMER' | 'VENDOR'
  }) => {
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to complete profile')
      }

      // Trigger session refresh
      await fetch('/api/auth/session?update=true')
      router.refresh()
      
      return true
    } catch (error) {
      console.error('Profile completion error:', error)
      throw error
    }
  }

  return {
    user: session?.user || null,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    unauthenticated: status === 'unauthenticated',
    loginWithLine,
    logout,
    completeProfile,
    session,
  }
}