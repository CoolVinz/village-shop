'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Search, Filter, MapPin, Store } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  category: string | null
  imageUrls: string[]
  isAvailable: boolean
  createdAt: string
  shop: {
    id: string
    name: string
    owner: {
      houseNumber: string
    }
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchProducts()
  }, [search, category, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      params.append('available', 'true')

      const response = await fetch(`/api/products?${params.toString()}`)
      if (response.ok) {
        const productsData = await response.json()
        
        // Sort products based on selection
        switch (sortBy) {
          case 'price-low':
            productsData.sort((a: Product, b: Product) => a.price - b.price)
            break
          case 'price-high':
            productsData.sort((a: Product, b: Product) => b.price - a.price)
            break
          case 'name':
            productsData.sort((a: Product, b: Product) => a.name.localeCompare(b.name))
            break
          case 'newest':
          default:
            productsData.sort((a: Product, b: Product) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            break
        }
        
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Village Products
          </h1>
          <p className="text-gray-600">
            Browse products from local shops in your village
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch('')
                setCategory('')
                setSortBy('newest')
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-4">
                {search || category 
                  ? 'Try adjusting your search or filters'
                  : 'No products are currently available'
                }
              </p>
              {(search || category) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setCategory('')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
              {search && ` for "${search}"`}
              {category && ` in ${category}`}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 relative">
                    {product.imageUrls.length > 0 ? (
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">
                        {product.stock} left
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ฿{product.price.toFixed(2)}
                        </span>
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Store className="h-3 w-3 mr-1" />
                        <span className="truncate">{product.shop.name}</span>
                        <span className="mx-1">•</span>
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>House {product.shop.owner.houseNumber}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Link href={`/products/${product.id}`}>
                        <Button className="w-full" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/shops/${product.shop.id}`}>
                        <Button variant="outline" className="w-full" size="sm">
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