'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Store, Search, MapPin, Filter } from 'lucide-react'
import Image from 'next/image'

interface Shop {
  id: string
  name: string
  description: string | null
  houseNumber: string
  logoUrl: string | null
  isActive: boolean
  createdAt: string
  owner: {
    id: string
    name: string
    houseNumber: string
  }
  _count: {
    products: number
    orderItems: number
  }
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchShops()
  }, [search, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchShops = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shops')
      if (response.ok) {
        let shopsData = await response.json()
        
        // Filter by search
        if (search) {
          shopsData = shopsData.filter((shop: Shop) =>
            shop.name.toLowerCase().includes(search.toLowerCase()) ||
            shop.description?.toLowerCase().includes(search.toLowerCase()) ||
            shop.owner.name.toLowerCase().includes(search.toLowerCase()) ||
            shop.houseNumber.includes(search)
          )
        }
        
        // Sort shops based on selection
        switch (sortBy) {
          case 'name':
            shopsData.sort((a: Shop, b: Shop) => a.name.localeCompare(b.name))
            break
          case 'products':
            shopsData.sort((a: Shop, b: Shop) => b._count.products - a._count.products)
            break
          case 'orders':
            shopsData.sort((a: Shop, b: Shop) => b._count.orderItems - a._count.orderItems)
            break
          case 'house':
            shopsData.sort((a: Shop, b: Shop) => 
              parseInt(a.houseNumber) - parseInt(b.houseNumber)
            )
            break
          case 'newest':
          default:
            shopsData.sort((a: Shop, b: Shop) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            break
        }
        
        setShops(shopsData)
      }
    } catch (error) {
      console.error('Error fetching shops:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Village Shops
          </h1>
          <p className="text-gray-600">
            Discover local shops from your neighbors
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search shops, owners, or house numbers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="house">House Number</SelectItem>
                <SelectItem value="products">Most Products</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch('')
                setSortBy('newest')
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Shops Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No shops found
              </h3>
              <p className="text-gray-600 mb-4">
                {search 
                  ? 'Try adjusting your search terms'
                  : 'No shops are currently available'
                }
              </p>
              {search && (
                <Button 
                  variant="outline"
                  onClick={() => setSearch('')}
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {shops.length} shop{shops.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </div>

            {/* Shops Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Card key={shop.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {shop.logoUrl ? (
                          <Image
                            src={shop.logoUrl}
                            alt={shop.name}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Store className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {shop.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>House {shop.houseNumber} • {shop.owner.name}</span>
                        </div>
                        {shop.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {shop.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Shop Stats */}
                      <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{shop._count.products}</div>
                          <div className="text-xs text-gray-500">Products</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{shop._count.orderItems}</div>
                          <div className="text-xs text-gray-500">Orders</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link href={`/shops/${shop.id}`} className="block">
                        <Button className="w-full">
                          Visit Shop
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}