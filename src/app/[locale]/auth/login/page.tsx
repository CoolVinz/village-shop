'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
// Legacy form inputs removed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Smartphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useNextAuth } from '@/hooks/useNextAuth'

function LoginPageContent() {
  const { user, loading: authLoading, authenticated } = useNextAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Legacy form state removed - NextAuth only
  const [lineLoading, setLineLoading] = useState(false)
  const [error, setError] = useState('')

  const redirect = searchParams.get('redirect') || '/'
  const errorParam = searchParams.get('error')
  const forceLogin = searchParams.get('force') === 'true'
  const switchAccount = searchParams.get('switch_account') === 'true'

  useEffect(() => {
    if (authenticated && user) {
      // Allow access to login page if user explicitly wants to force login or switch accounts
      const allowLoginPageAccess = forceLogin || switchAccount
      
      if (!allowLoginPageAccess) {
        if (user.profileComplete) {
          router.push(redirect)
        } else {
          router.push(`/auth/complete-profile?callbackUrl=${encodeURIComponent(redirect)}`)
        }
      }
    }
  }, [user, authenticated, router, redirect, forceLogin, switchAccount])

  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case 'customer_access_required':
          setError('Customer access required. Please log in with a customer account.')
          break
        case 'insufficient_permissions':
          setError('You do not have permission to access this page.')
          break
        default:
          setError('An authentication error occurred. Please try again.')
      }
    }
  }, [errorParam])

  const handleLineLogin = async () => {
    setLineLoading(true)
    setError('')
    
    try {
      await signIn('line', {
        callbackUrl: user?.profileComplete ? redirect : `/auth/complete-profile?callbackUrl=${encodeURIComponent(redirect)}`,
        redirect: true,
      })
    } catch (error) {
      console.error('LINE login error:', error)
      setError('Failed to login with LINE. Please try again.')
      setLineLoading(false)
    }
  }

  const { logout } = useNextAuth()

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Sign out error:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  const handleContinue = () => {
    if (user?.profileComplete) {
      router.push(redirect)
    } else {
      router.push(`/auth/complete-profile?callbackUrl=${encodeURIComponent(redirect)}`)
    }
  }

  // Legacy traditional login removed - NextAuth only

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Village Shop</CardTitle>
          <p className="text-gray-600">
            Sign in to start shopping from your village marketplace
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Show different content based on authentication status */}
          {authenticated && user ? (
            /* Already Authenticated - Show User Info and Options */
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You&apos;re already signed in as <strong>{user.name}</strong>
                  {user.lineId && ' (LINE account)'}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button 
                  onClick={handleContinue}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue to Village Shop
                </Button>

                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out & Use Different Account
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Want to switch accounts? Sign out first to use a different login method.
                </p>
              </div>
            </div>
          ) : (
            /* Not Authenticated - Show Login Forms */
            <>
              {/* LINE Login - Primary CTA */}
              <div className="space-y-3">
                <Button 
                  onClick={handleLineLogin}
                  disabled={lineLoading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-6"
                >
                  {lineLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Connecting to LINE...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Continue with LINE
                    </div>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Quick & secure login with your LINE account
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                {/* Legacy traditional login removed - NextAuth LINE Login only */}
              </div>
              {/* Legacy form fields removed */}

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  New to Village Shop?{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Secure authentication powered by NextAuth.js
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}