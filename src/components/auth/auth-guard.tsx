'use client'

import { useAuth } from '@/hooks/useAuth'
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
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Still loading

    if (!user) {
      // Not signed in, redirect to login page
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (user && requiredRoles.length > 0) {
      // Check if user has required role
      if (!requiredRoles.includes(user.role as UserRole)) {
        // User doesn't have required role, redirect to unauthorized page
        router.push('/?error=unauthorized')
        return
      }
    }
  }, [user, loading, router, requiredRoles, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (user && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role as UserRole)) {
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