'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// Legacy useAuth removed - NextAuth signout only
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LogOut } from 'lucide-react'

export default function SignOutPage() {
  const [isLoading, setIsLoading] = useState(false)
  // Legacy logout removed - NextAuth signOut only
  const router = useRouter()

  // Legacy user check removed

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      // Legacy logout removed - use NextAuth signOut
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  // Legacy user check removed

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Sign Out
          </h1>
          <p className="mt-2 text-gray-600">
            Are you sure you want to sign out?
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Confirm Sign Out</CardTitle>
            <CardDescription>
              You will be signed out of Village Marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600 p-4 bg-gray-50 rounded">
              <p>Legacy auth system removed</p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleSignOut}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Signing out...' : 'Sign Out'}
              </Button>

              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}