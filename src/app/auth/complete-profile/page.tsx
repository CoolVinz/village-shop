'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserRole } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function CompleteProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    houseNumber: '',
    phone: '',
    address: '',
    role: UserRole.CUSTOMER,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if user is not logged in or profile is already complete
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (user.profileComplete) {
      router.push('/')
      return
    }
  }, [user, router])

  if (!user) {
    return <div>Loading...</div>
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/')
      } else {
        const data = await response.json()
        setError(data.error || 'Profile completion failed')
      }
    } catch {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <p className="text-gray-600">Welcome, {user.name}!</p>
          <p className="text-sm text-gray-500">
            Please provide your village information to complete your account setup.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="houseNumber">House Number *</Label>
              <Input
                id="houseNumber"
                type="text"
                placeholder="e.g., 123/4"
                value={formData.houseNumber}
                onChange={(e) => handleChange('houseNumber', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 081-234-5678"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="Additional address details"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.CUSTOMER}>Customer - I want to buy products</SelectItem>
                  <SelectItem value={UserRole.VENDOR}>Vendor - I want to sell products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Completing Profile...' : 'Complete Profile'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-xs text-gray-500">
            This information helps us serve your village marketplace better.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}