import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Package, MapPin, Users, TrendingUp, Plus, Store, ShoppingBag } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'

async function getShop(shopId: string, userId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          houseNumber: true,
        }
      },
      products: {
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              orderItems: true
            }
          }
        }
      },
      _count: {
        select: {
          products: true,
          orderItems: true,
        }
      },
      orderItems: {
        take: 5,
        orderBy: { 
          order: { 
            createdAt: 'desc' 
          } 
        },
        include: {
          order: {
            select: {
              id: true,
              createdAt: true,
              totalAmount: true,
              customer: {
                select: {
                  name: true,
                  houseNumber: true,
                }
              }
            }
          },
          product: {
            select: {
              name: true,
            }
          }
        }
      }
    }
  })

  if (!shop) {
    notFound()
  }

  // Verify ownership
  if (shop.ownerId !== userId && userId !== 'admin') { // Allow admin access
    redirect('/vendor/shop?error=unauthorized')
  }

  return shop
}

async function ShopViewContent({ shopId }: { shopId: string }) {
  // Get authentication token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/auth/login?redirect=/vendor/shop')
  }

  // Verify the token and get user info
  const user = verifyToken(token)
  if (!user) {
    redirect('/auth/login?redirect=/vendor/shop')
  }

  // Check if user has vendor role
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/auth/login?error=insufficient_permissions')
  }

  const shop = await getShop(shopId, user.id)

  // Calculate total revenue from recent orders
  const totalRevenue = shop.orderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/shop">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shops
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <p className="text-muted-foreground">
              Shop overview and management
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/vendor/shop/${shop.id}/products`}>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
          </Link>
          <Link href={`/vendor/shop/${shop.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Shop
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shop Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                {/* Shop Logo */}
                <div className="flex-shrink-0">
                  {shop.logoUrl ? (
                    <div className="w-20 h-20 relative overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={shop.logoUrl}
                        alt={shop.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Store className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Shop Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{shop.name}</h3>
                    <Badge variant={shop.isActive ? 'default' : 'secondary'}>
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {shop.description && (
                    <p className="text-gray-600">{shop.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      House #{shop.houseNumber}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Owner: {shop.owner.name}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Products</CardTitle>
                  <CardDescription>
                    Latest products in this shop
                  </CardDescription>
                </div>
                <Link href={`/vendor/shop/${shop.id}/products`}>
                  <Button variant="outline" size="sm">
                    View All ({shop._count.products})
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {shop.products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shop.products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 rounded-md mb-3 relative overflow-hidden">
                        {product.imageUrls && product.imageUrls.length > 0 ? (
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
                      </div>
                      <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{formatCurrency(Number(product.price))}</span>
                        <span>{product._count.orderItems} orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No products yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add your first product to start selling
                  </p>
                  <Link href="/vendor/products/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics & Recent Orders */}
        <div className="space-y-6">
          {/* Shop Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Shop Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Total Products</span>
                </div>
                <span className="font-semibold">{shop._count.products}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Total Orders</span>
                </div>
                <span className="font-semibold">{shop._count.orderItems}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Recent Revenue</span>
                </div>
                <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500">
                  Created: {new Date(shop.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  Updated: {new Date(shop.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>
                    Latest orders from this shop
                  </CardDescription>
                </div>
                <Link href="/vendor/orders">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {shop.orderItems.length > 0 ? (
                <div className="space-y-3">
                  {shop.orderItems.map((orderItem) => (
                    <div key={orderItem.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{orderItem.product.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {orderItem.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Customer: {orderItem.order.customer.name}</div>
                        <div>House: {orderItem.order.customer.houseNumber}</div>
                        <div className="flex justify-between">
                          <span>Qty: {orderItem.quantity}</span>
                          <span>{formatCurrency(Number(orderItem.price) * orderItem.quantity)}</span>
                        </div>
                        <div>{new Date(orderItem.order.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function VendorShopPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shops
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Loading...</h1>
              <p className="text-muted-foreground">Shop details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
            <Button disabled>
              <Edit className="h-4 w-4 mr-2" />
              Edit Shop
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    }>
      <ShopViewContentWrapper params={params} />
    </Suspense>
  )
}

async function ShopViewContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShopViewContent shopId={id} />
}