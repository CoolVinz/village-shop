'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
const NEXTAUTH_URL = process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const success = await login(username, password)
    if (success) {
      router.push('/')
    } else {
      setError('Invalid username or password')
    }
    setLoading(false)
  }

  const handleLineLogin = () => {
    if (!LINE_CLIENT_ID) {
      setError('LINE Login is not configured')
      return
    }

    const state = Math.random().toString(36).substring(2, 15)
    const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
    lineAuthUrl.searchParams.set('response_type', 'code')
    lineAuthUrl.searchParams.set('client_id', LINE_CLIENT_ID)
    lineAuthUrl.searchParams.set('redirect_uri', `${NEXTAUTH_URL}/api/auth/line/callback`)
    lineAuthUrl.searchParams.set('state', state)
    lineAuthUrl.searchParams.set('scope', 'profile')

    window.location.href = lineAuthUrl.toString()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Village Shop Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* LINE Login Option */}
          {LINE_CLIENT_ID && (
            <div className="space-y-4">
              <Button 
                onClick={handleLineLogin} 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                Continue with LINE
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-500">or</span>
                </div>
              </div>
            </div>
          )}

          {/* Username/Password Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">House Number</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g., 123/4"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login with Password'}
            </Button>
          </form>
          
          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => router.push('/auth/register')}
            >
              Don&apos;t have an account? Register here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}