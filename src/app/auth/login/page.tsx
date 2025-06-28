'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogIn, Smartphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useNextAuth } from '@/hooks/useNextAuth'

export default function LoginPage() {
  const { user, loading: authLoading, authenticated } = useNextAuth()
  const { login } = useAuth() // Keep for backward compatibility
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
  const [error, setError] = useState('')

  const redirect = searchParams.get('redirect') || '/'
  const errorParam = searchParams.get('error')

  useEffect(() => {
    if (authenticated && user) {
      if (user.profileComplete) {
        router.push(redirect)
      } else {
        router.push(`/auth/complete-profile?callbackUrl=${encodeURIComponent(redirect)}`)
      }
    }
  }, [user, authenticated, router, redirect])

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

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(username, password)
      if (success) {
        router.push(redirect)
      } else {
        setError('Invalid username or password')
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with username</span>
            </div>
          </div>

          {/* Traditional Login - Secondary */}
          <form onSubmit={handleTraditionalLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username or House Number</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username or house number"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>

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
        </CardContent>
      </Card>
    </div>
  )
}