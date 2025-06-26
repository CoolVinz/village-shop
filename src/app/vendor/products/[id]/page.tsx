import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Package, Store, Calendar } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { findProductBySlugOrId, getVendorShopUrl } from '@/lib/db-helpers'

async function getProduct(productSlugOrId: string, userId: string) {
  const foundProduct = await findProductBySlugOrId(productSlugOrId)
  
  if (!foundProduct) {
    notFound()
  }

  const product = await prisma.product.findUnique({
    where: { id: foundProduct.id },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          slug: true,
        }
      },
      _count: {
        select: {
          orderItems: true
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
              customer: {
                select: {
                  name: true,
                  houseNumber: true,
                }
              }
            }
          }
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Verify ownership
  if (product.shop.ownerId !== userId) {
    redirect('/vendor/products?error=unauthorized')
  }

  return product
}

async function ProductViewContent({ productSlugOrId }: { productSlugOrId: string }) {
  // Get authentication token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/auth/login?redirect=/vendor/products')
  }

  // Verify the token and get user info
  const user = verifyToken(token)
  if (!user) {
    redirect('/auth/login?redirect=/vendor/products')
  }

  // Check if user has vendor role
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/auth/login?error=insufficient_permissions')
  }

  const product = await getProduct(productSlugOrId, user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              Product details and management
            </p>
          </div>
        </div>
        <Link href={`/vendor/products/${product.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  <Image
                    src={product.imageUrls[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Additional Images */}
                {product.imageUrls.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {product.imageUrls.slice(1, 4).map((imageUrl, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        <Image
                          src={imageUrl}
                          alt={`${product.name} ${index + 2}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {product.imageUrls.length > 4 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{product.imageUrls.length - 4} more images
                  </p>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No images uploaded</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                  {product.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Price:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(Number(product.price))}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Stock:</span>
                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stock} units
                </span>
              </div>
              
              {product.category && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Shop:</span>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <Link 
                    href={getVendorShopUrl(product.shop)}
                    className="text-blue-600 hover:underline"
                  >
                    {product.shop.name}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sales Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Orders:</span>
                <span className="text-lg font-semibold">{product._count.orderItems}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Created:</span>
                <span className="text-sm text-gray-600">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Last Updated:</span>
                <span className="text-sm text-gray-600">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders */}
      {product.orderItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.orderItems.map((orderItem) => (
                <div key={orderItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{orderItem.order.customer.name}</p>
                      <p className="text-sm text-gray-600">
                        House {orderItem.order.customer.houseNumber} • {orderItem.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(orderItem.price) * orderItem.quantity)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(orderItem.order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {product._count.orderItems > 5 && (
              <div className="text-center mt-4">
                <Link href="/vendor/orders">
                  <Button variant="outline" size="sm">
                    View All Orders
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function VendorProductPage({ 
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
              Back to Products
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Loading...</h1>
              <p className="text-muted-foreground">Product details</p>
            </div>
          </div>
          <Button disabled>
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            </CardContent>
          </Card>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductViewContentWrapper params={params} />
    </Suspense>
  )
}

async function ProductViewContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductViewContent productSlugOrId={id} />
}