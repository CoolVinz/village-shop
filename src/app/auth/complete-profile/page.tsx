'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Phone, User, CheckCircle } from 'lucide-react'
import { useNextAuth } from '@/hooks/useNextAuth'

export default function CompleteProfilePage() {
  const { data: session, status } = useSession()
  const { completeProfile } = useNextAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    houseNumber: '',
    phone: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'VENDOR',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    // Redirect if user is not logged in
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    
    // Redirect if profile is already complete
    if (session?.user?.profileComplete) {
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      router.push(callbackUrl)
      return
    }
  }, [session, status, router, searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.houseNumber.trim()) {
        throw new Error('House number is required')
      }

      await completeProfile({
        houseNumber: formData.houseNumber.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
      })

      // Redirect to original destination or home
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      router.push(callbackUrl)
    } catch (error) {
      console.error('Profile completion error:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">Welcome to Village Shop!</CardTitle>
          <p className="text-gray-600">
            Hello {session.user.name}! Let&apos;s complete your profile to start shopping.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="houseNumber" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                House Number *
              </Label>
              <Input
                id="houseNumber"
                type="text"
                placeholder="e.g., 123/4, A-15, etc."
                value={formData.houseNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, houseNumber: e.target.value }))}
                required
                autoFocus
                className="text-lg"
              />
              <p className="text-xs text-gray-500">
                Your house number for deliveries in the village
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0xx-xxx-xxxx"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="text-lg"
              />
              <p className="text-xs text-gray-500">
                For order updates and delivery coordination
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Account Type
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: 'CUSTOMER' | 'VENDOR') => 
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Customer - I want to shop
                    </div>
                  </SelectItem>
                  <SelectItem value="VENDOR">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Vendor - I want to sell products
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full text-lg py-6"
              disabled={loading || !formData.houseNumber.trim()}
            >
              {loading ? 'Completing Profile...' : 'Complete Profile & Start Shopping'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By completing your profile, you agree to our terms of service and can start enjoying the village marketplace experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}