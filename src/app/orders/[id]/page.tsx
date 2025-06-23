import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Package, Store, Calendar, Phone, User, Home } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

async function getOrder(id: string) {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          houseNumber: true,
          phone: true
        }
      },
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrls: true
            }
          },
          shop: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  name: true,
                  houseNumber: true,
                  phone: true
                }
              }
            }
          }
        }
      }
    }
  })
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

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  // Group order items by shop
  const itemsByShop = order.orderItems.reduce((acc, item) => {
    if (!acc[item.shopId]) {
      acc[item.shopId] = {
        shop: item.shop,
        items: [],
        shopTotal: 0
      }
    }
    acc[item.shopId].items.push(item)
    acc[item.shopId].shopTotal += Number(item.price) * item.quantity
    return acc
  }, {} as Record<string, { shop: typeof order.orderItems[0]['shop']; items: typeof order.orderItems; shopTotal: number }>)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
              <p className="text-gray-600">Your order has been successfully placed</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-mono text-lg"># {order.id.slice(-8).toUpperCase()}</p>
            </div>
            <Badge variant="outline" className={getStatusColor(order.status)}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{order.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-500" />
                  <span>House #{order.customer.houseNumber}</span>
                </div>
                {order.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}
                {order.deliveryTime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Delivery: {new Date(order.deliveryTime).toLocaleString()}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Order Notes:</p>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items by Shop */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(itemsByShop).map(([shopId, { shop, items, shopTotal }]) => (
                    <div key={shopId} className="space-y-4">
                      {/* Shop Header */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Store className="h-5 w-5 text-gray-600" />
                          <div>
                            <h3 className="font-semibold">{shop.name}</h3>
                            <p className="text-sm text-gray-600">
                              {shop.owner.name} • House #{shop.owner.houseNumber}
                            </p>
                            {shop.owner.phone && (
                              <p className="text-sm text-gray-600">{shop.owner.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(shopTotal)}</p>
                          <p className="text-sm text-gray-600">{items.length} items</p>
                        </div>
                      </div>

                      {/* Shop Items */}
                      <div className="space-y-3 pl-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-white border rounded-lg">
                            <div className="flex-shrink-0">
                              {item.product.imageUrls[0] ? (
                                <Image
                                  src={item.product.imageUrls[0]}
                                  alt={item.product.name}
                                  width={60}
                                  height={60}
                                  className="rounded-md object-cover"
                                />
                              ) : (
                                <div className="w-15 h-15 bg-gray-200 rounded-md flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product.name}</h4>
                              {item.product.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {item.product.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Qty: {item.quantity}</span>
                                  <span>{formatCurrency(Number(item.price))} each</span>
                                </div>
                                <span className="font-semibold">
                                  {formatCurrency(Number(item.price) * item.quantity)}
                                </span>
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline" className={getStatusColor(item.status)}>
                                  {item.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {Object.keys(itemsByShop).indexOf(shopId) < Object.keys(itemsByShop).length - 1 && (
                        <Separator />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items ({order.orderItems.length})</span>
                    <span>{formatCurrency(Number(order.totalAmount))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.totalAmount))}</span>
                </div>
                
                <div className="pt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Order placed:</strong> {new Date(order.createdAt).toLocaleString()}
                  </p>
                  {order.deliveryTime && (
                    <p className="text-sm text-gray-600">
                      <strong>Requested delivery:</strong> {new Date(order.deliveryTime).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Link href="/products">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/orders">
                <Button className="w-full">
                  View All Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}