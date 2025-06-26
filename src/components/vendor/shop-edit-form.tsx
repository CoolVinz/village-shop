'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Shop {
  id: string
  name: string
  description: string | null
  houseNumber: string
  logoUrl: string | null
  isActive: boolean
  owner: {
    id: string
    name: string
    houseNumber: string
  }
}

interface ShopEditFormProps {
  shop: Shop
}

export default function ShopEditForm({ shop }: ShopEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: shop.name,
    description: shop.description || '',
    houseNumber: shop.houseNumber,
    logoUrl: shop.logoUrl || '',
    isActive: shop.isActive,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Shop name is required')
      return
    }

    if (!formData.houseNumber.trim()) {
      toast.error('House number is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          houseNumber: formData.houseNumber.trim(),
          logoUrl: formData.logoUrl.trim() || null,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update shop')
      }

      toast.success('Shop updated successfully!')
      router.push('/vendor/shop')
      router.refresh()
    } catch (error) {
      console.error('Error updating shop:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update shop')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this shop? This action cannot be undone.')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete shop')
      }

      toast.success('Shop deleted successfully!')
      router.push('/vendor/shop')
      router.refresh()
    } catch (error) {
      console.error('Error deleting shop:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete shop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Shop Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter shop name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your shop..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="houseNumber">House Number *</Label>
          <Input
            id="houseNumber"
            value={formData.houseNumber}
            onChange={(e) => handleInputChange('houseNumber', e.target.value)}
            placeholder="e.g., 123/4"
            required
          />
        </div>

        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            value={formData.logoUrl}
            onChange={(e) => handleInputChange('logoUrl', e.target.value)}
            placeholder="https://example.com/logo.jpg"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
          />
          <Label htmlFor="isActive">Shop is active</Label>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete Shop'
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/vendor/shop')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}