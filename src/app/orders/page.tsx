'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, Search, Calendar, Store, Eye, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface Order {
  id: string
  customerHouseNumber: string
  deliveryTime: string | null
  totalAmount: number
  status: string
  notes: string | null
  createdAt: string
  customer: {
    id: string
    name: string
    houseNumber: string
    phone: string | null
  }
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    status: string
    product: {
      id: string
      name: string
      imageUrls: string[]
    }
    shop: {
      id: string
      name: string
    }
  }>
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'PREPARING':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'READY_FOR_DELIVERY':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'DELIVERED':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searchHouseNumber, setSearchHouseNumber] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const fetchOrders = async (houseNumber: string) => {
    if (!houseNumber.trim()) return

    setLoading(true)
    setHasSearched(true)
    
    try {
      const response = await fetch(`/api/orders?houseNumber=${encodeURIComponent(houseNumber.trim())}`)
      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      } else {
        console.error('Error fetching orders:', response.statusText)
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders(searchHouseNumber)
  }

  // Group orders by shop for better display
  const getOrderShops = (order: Order) => {
    const shops = order.orderItems.reduce((acc, item) => {
      if (!acc[item.shop.id]) {
        acc[item.shop.id] = {
          name: item.shop.name,
          items: []
        }
      }
      acc[item.shop.id].items.push(item)
      return acc
    }, {} as Record<string, { name: string; items: Order['orderItems'] }>)
    
    return Object.values(shops)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">Track your orders from village shops</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Your Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="houseNumber">House Number</Label>
                <Input
                  id="houseNumber"
                  value={searchHouseNumber}
                  onChange={(e) => setSearchHouseNumber(e.target.value)}
                  placeholder="Enter your house number (e.g., 123)"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter your house number to view all orders placed from your address
                </p>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search Orders'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasSearched && orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchHouseNumber 
                  ? `No orders found for house number "${searchHouseNumber}"`
                  : 'Try searching with your house number'
                }
              </p>
              <Link href="/products">
                <Button>
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : hasSearched ? (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Found {orders.length} order{orders.length !== 1 ? 's' : ''} for house #{searchHouseNumber}
            </div>

            {orders.map((order) => {
              const shops = getOrderShops(order)
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span>{order.orderItems.length} items</span>
                          <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {shops.map((shop, shopIndex) => (
                        <div key={shop.name} className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Store className="h-4 w-4" />
                            {shop.name}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                            {shop.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0">
                                  {item.product.imageUrls[0] ? (
                                    <Image
                                      src={item.product.imageUrls[0]}
                                      alt={item.product.name}
                                      width={40}
                                      height={40}
                                      className="rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                      <Package className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium line-clamp-1">
                                    {item.product.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Qty: {item.quantity} • {formatCurrency(item.price * item.quantity)}
                                  </p>
                                  <Badge 
                                    variant="outline" 
                                    className={`${getStatusColor(item.status)} text-xs mt-1`}
                                  >
                                    {item.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            {shop.items.length > 3 && (
                              <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                                +{shop.items.length - 3} more items
                              </div>
                            )}
                          </div>

                          {shopIndex < shops.length - 1 && <Separator />}
                        </div>
                      ))}

                      {order.deliveryTime && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            Requested delivery: {new Date(order.deliveryTime).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {order.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {order.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Track Your Orders
              </h3>
              <p className="text-gray-600 mb-6">
                Enter your house number above to view all your orders from village shops
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}