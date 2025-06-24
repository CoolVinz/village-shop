'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/vendor'
  const error = searchParams.get('error')

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })

    // Show error message if there's an authentication error
    if (error) {
      switch (error) {
        case 'OAuthCallback':
          toast.error('Authentication failed. Please try again.')
          break
        case 'OAuthSignin':
          toast.error('Error signing in with LINE. Please try again.')
          break
        default:
          toast.error('An error occurred during authentication.')
      }
    }
  }, [router, callbackUrl, error])

  const handleLineSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signIn('line', { 
        callbackUrl,
        redirect: false 
      })
      
      if (result?.error) {
        toast.error('Failed to sign in with LINE. Please try again.')
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Village Marketplace
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to access your account
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your LINE account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleLineSignIn}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Signing in...' : 'Sign in with LINE'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>
                New to our marketplace? Your LINE account will be automatically 
                registered as a customer account.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to marketplace
          </Button>
        </div>
      </div>
    </div>
  )
}