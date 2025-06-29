import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import OrderItemCard from '@/components/vendor/order-item-card'

async function getVendorOrders(vendorId: string) {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      shop: {
        ownerId: vendorId
      }
    },
    include: {
      order: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              houseNumber: true,
              phone: true
            }
          },
          paymentSlips: true
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          imageUrls: true
        }
      },
      shop: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      order: {
        createdAt: 'desc'
      }
    }
  })

  return orderItems
}


interface AuthSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
    houseNumber?: string | null
    profileComplete: boolean
  }
}

async function OrdersContent() {
  // First try NextAuth session (for LINE users)
  const session = await getServerSession(authOptions) as AuthSession | null
  let user = null
  
  if (session?.user) {
    user = session.user
  } else {
    // Fall back to JWT authentication (for traditional users)
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (token) {
      user = verifyToken(token)
    }
  }

  if (!user) {
    redirect('/auth/login?redirect=/vendor/orders')
  }

  // Check if user has vendor role
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/auth/login?error=insufficient_permissions')
  }

  // Get orders for the authenticated user
  const orderItems = await getVendorOrders(user.id)
  
  // Debug information for development
  console.log(`🔍 Vendor Orders Debug: Authenticated user ${user.name} (${user.id}), found ${orderItems.length} order items`)

  // Group order items by status
  const groupedOrders = {
    pending: orderItems.filter(item => item.status === 'PENDING'),
    confirmed: orderItems.filter(item => item.status === 'CONFIRMED'),
    preparing: orderItems.filter(item => item.status === 'PREPARING'),
    ready: orderItems.filter(item => item.status === 'READY'),
    delivered: orderItems.filter(item => item.status === 'DELIVERED'),
    cancelled: orderItems.filter(item => item.status === 'CANCELLED')
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">
          Manage and track orders for your shops
        </p>
      </div>

      {orderItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              Orders from customers will appear here when they place them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pending" className="relative">
              Pending
              {groupedOrders.pending.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {groupedOrders.pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed
              {groupedOrders.confirmed.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {groupedOrders.confirmed.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing">
              Preparing
              {groupedOrders.preparing.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {groupedOrders.preparing.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {groupedOrders.pending.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No pending orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {groupedOrders.pending.map(orderItem => (
                  <OrderItemCard key={orderItem.id} orderItem={orderItem} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {groupedOrders.confirmed.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No confirmed orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {groupedOrders.confirmed.map(orderItem => (
                  <OrderItemCard key={orderItem.id} orderItem={orderItem} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparing" className="space-y-4">
            {groupedOrders.preparing.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No orders being prepared</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {groupedOrders.preparing.map(orderItem => (
                  <OrderItemCard key={orderItem.id} orderItem={orderItem} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            {groupedOrders.ready.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No orders ready for delivery</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {groupedOrders.ready.map(orderItem => (
                  <OrderItemCard key={orderItem.id} orderItem={orderItem} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            {groupedOrders.delivered.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No delivered orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {groupedOrders.delivered.map(orderItem => (
                  <OrderItemCard key={orderItem.id} orderItem={orderItem} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {groupedOrders.cancelled.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <XCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No cancelled orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {groupedOrders.cancelled.map(orderItem => (
                  <OrderItemCard key={orderItem.id} orderItem={orderItem} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default function VendorOrdersPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}