'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRole } from '@prisma/client'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requiredRoles = [], 
  redirectTo = '/auth/signin' 
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (status === 'unauthenticated') {
      // Not signed in, redirect to signin page
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (session && requiredRoles.length > 0) {
      // Check if user has required role
      if (!requiredRoles.includes(session.user.role as UserRole)) {
        // User doesn't have required role, redirect to unauthorized page
        router.push('/?error=unauthorized')
        return
      }
    }
  }, [session, status, router, requiredRoles, redirectTo])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  if (session && requiredRoles.length > 0) {
    if (!requiredRoles.includes(session.user.role as UserRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Checking permissions...</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}