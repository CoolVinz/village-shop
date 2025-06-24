'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

const errorMessages: { [key: string]: { title: string; description: string } } = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is an issue with the server configuration. Please contact support.'
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.'
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification link has expired or is invalid.'
  },
  OAuthSignin: {
    title: 'OAuth Sign-in Error',
    description: 'There was an error signing in with LINE. Please try again.'
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was an error processing the authentication callback.'
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create an account with the provided information.'
  },
  EmailCreateAccount: {
    title: 'Email Account Creation Error',
    description: 'Could not create an account with the email provided.'
  },
  Callback: {
    title: 'Callback Error',
    description: 'There was an error in the authentication callback.'
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'This account is not linked to any existing user. Please contact support.'
  },
  EmailSignin: {
    title: 'Email Sign-in Error',
    description: 'There was an error sending the sign-in email.'
  },
  CredentialsSignin: {
    title: 'Credentials Error',
    description: 'Invalid credentials provided.'
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.'
  },
  default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.'
  }
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error') || 'default'
  
  const errorInfo = errorMessages[error] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Village Marketplace
          </h1>
        </div>

        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">{errorInfo.title}</CardTitle>
            <CardDescription className="text-red-700">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error !== 'default' && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800">
                  <strong>Error Code:</strong> {error}
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>
                If this problem persists, please contact support with the error code above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}