'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, Calendar, Store, Eye, AlertCircle, LogIn } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNextAuth } from '@/hooks/useNextAuth'
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
  const { user, loading: authLoading } = useNextAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  // Redirect non-authenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/orders')
      return
    }
    
    if (!authLoading && user?.role !== 'CUSTOMER') {
      router.push('/auth/login?error=customer_access_required')
      return
    }
  }, [user, authLoading, router])

  const fetchCustomerOrders = useCallback(async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/orders?customerId=${user.id}`)
      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      } else if (response.status === 401) {
        router.push('/auth/login?redirect=/orders')
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
  }, [user?.id, router])

  // Auto-load orders for authenticated customers
  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      fetchCustomerOrders()
    }
  }, [user, fetchCustomerOrders])

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

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
      </div>
    )
  }

  // Show login prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <LogIn className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Login Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please log in to view your orders
              </p>
              <Link href="/auth/login?redirect=/orders">
                <Button>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error for non-customer users
  if (user.role !== 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Customer Access Required
              </h3>
              <p className="text-gray-600 mb-6">
                Only customers can access order tracking
              </p>
              <Link href="/">
                <Button>
                  Go Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Orders
          </h1>
          <p className="text-gray-600">
            Welcome back, {user.name}! Track your orders from village shops
          </p>
        </div>

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
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t placed any orders yet. Start shopping to see your orders here!
              </p>
              <Link href="/products">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              You have {orders.length} order{orders.length !== 1 ? 's' : ''}
            </div>

            {orders.map((order) => {
              const shops = getOrderShops(order)
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
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
        )}
      </div>
    </div>
  )
}