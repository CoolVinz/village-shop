import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Store, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

async function getVendorStats(userId: string) {
  const [shops, products, orders, recentOrders] = await Promise.all([
    // Get vendor's shops
    prisma.shop.findMany({
      where: { ownerId: userId },
      include: {
        products: true,
        _count: {
          select: {
            products: true,
            orderItems: true,
          }
        }
      }
    }),
    
    // Get total products
    prisma.product.count({
      where: {
        shop: {
          ownerId: userId
        }
      }
    }),
    
    // Get total orders
    prisma.orderItem.count({
      where: {
        shop: {
          ownerId: userId
        }
      }
    }),
    
    // Get recent orders
    prisma.orderItem.findMany({
      where: {
        shop: {
          ownerId: userId
        }
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        product: true
      },
      orderBy: {
        order: {
          createdAt: 'desc'
        }
      },
      take: 5
    })
  ])

  const totalRevenue = await prisma.orderItem.aggregate({
    where: {
      shop: {
        ownerId: userId
      },
      status: 'DELIVERED'
    },
    _sum: {
      price: true
    }
  })

  return {
    shops,
    totalShops: shops.length,
    totalProducts: products,
    totalOrders: orders,
    totalRevenue: totalRevenue._sum.price || 0,
    recentOrders
  }
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

export default async function VendorDashboard() {
  // Use NextAuth session only
  const session = await getServerSession(authOptions) as AuthSession | null
  
  if (!session?.user) {
    redirect('/auth/login')
  }
  
  const user = session.user
  
  // Check if user is vendor or admin
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only vendors and admins can access this page.</p>
        </div>
      </div>
    )
  }
  
  const stats = await getVendorStats(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Overview of your village shop performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShops}</div>
            <p className="text-xs text-muted-foreground">
              Your active shops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Items in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Total order items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From delivered orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders from your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No orders yet
                </p>
              ) : (
                stats.recentOrders.map((orderItem) => (
                  <div key={orderItem.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {orderItem.status === 'DELIVERED' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : orderItem.status === 'PENDING' ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {orderItem.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {orderItem.order.customer.name} • House #{orderItem.order.customer.houseNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ฿{orderItem.price.toNumber() * orderItem.quantity}
                      </p>
                      <Badge variant={
                        orderItem.status === 'DELIVERED' ? 'default' :
                        orderItem.status === 'PENDING' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {orderItem.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shop Status */}
        <Card>
          <CardHeader>
            <CardTitle>My Shops</CardTitle>
            <CardDescription>
              Status and performance of your shops
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.shops.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">
                    No shops yet
                  </p>
                  <Link 
                    href="/vendor/shop/create" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Create your first shop
                  </Link>
                </div>
              ) : (
                stats.shops.map((shop) => (
                  <div key={shop.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{shop.name}</h4>
                      <p className="text-sm text-gray-500">
                        House #{shop.houseNumber} • {shop._count.products} products
                      </p>
                    </div>
                    <Badge variant={shop.isActive ? 'default' : 'secondary'}>
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}