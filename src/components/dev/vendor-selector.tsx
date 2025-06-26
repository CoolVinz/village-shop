'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

const MOCK_VENDORS = [
  { id: 'vendor-1', name: 'Somchai Jaidee', shop: "Somchai's Grocery", products: 4 },
  { id: 'vendor-2', name: 'Malee Kaewjai', shop: "Malee's Hardware Store", products: 3 },
  { id: 'vendor-3', name: 'Niran Thongchai', shop: "Niran's Handicrafts", products: 3 },
  { id: 'cmcbdfmiq0000q90kgu67wq6h', name: 'aivinz', shop: 'aivinz', products: 3 },
  { id: 'dev-user-1', name: 'Development User', shop: 'No shop', products: 0 },
]

interface VendorSelectorProps {
  currentVendor: string
}

export function VendorSelector({ currentVendor }: VendorSelectorProps) {
  const [selectedVendor, setSelectedVendor] = useState(currentVendor)
  const router = useRouter()

  const handleVendorChange = () => {
    // In a real app, this would update the session or URL parameter
    // For now, we'll just refresh with the new vendor ID
    // This is just for development convenience
    router.refresh()
  }

  const current = MOCK_VENDORS.find(v => v.id === currentVendor)

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
          <p className="text-xs text-yellow-600">
            Currently viewing as: <strong>{current?.name}</strong> ({current?.shop})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-700">
            {current?.products} products
          </Badge>
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_VENDORS.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name} ({vendor.products} products)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleVendorChange}>
            Switch
          </Button>
        </div>
      </div>
    </div>
  )
}