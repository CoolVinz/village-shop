import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Edit, Eye, MoreVertical, ArrowLeft, Store } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth-config'
import { formatCurrency } from '@/lib/utils'

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
      }
    }
  })

  if (!shop) {
    notFound()
  }

  // Verify ownership
  if (shop.ownerId !== userId) {
    redirect('/vendor/shop?error=unauthorized')
  }

  return shop
}

async function getShopProducts(shopId: string) {
  return await prisma.product.findMany({
    where: {
      shopId: shopId
    },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
        }
      },
      _count: {
        select: {
          orderItems: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

async function ShopProductsContent({ shopId }: { shopId: string }) {
  console.log(`🔍 Shop Products Debug: Starting with shopId: ${shopId}`)
  
  // Get NextAuth session
  const session = await getServerSession(authOptions) as AuthSession | null
  
  if (!session?.user) {
    console.log('❌ No NextAuth session, redirecting to login')
    redirect('/auth/login?redirect=/vendor/shop')
  }

  const user = session.user
  console.log('✅ NextAuth user found:', user.name)

  console.log('👤 Authenticated user:', { id: user.id, name: user.name, role: user.role })

  // Check if user has vendor role
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    console.log('❌ Insufficient permissions:', user.role)
    redirect('/auth/login?error=insufficient_permissions')
  }

  // Get shop and verify ownership
  console.log('🏪 Fetching shop data...')
  const shop = await getShop(shopId, user.id)
  console.log('🏪 Shop fetched:', { id: shop.id, name: shop.name, ownerId: shop.ownerId })
  
  console.log('📦 Fetching products...')
  const products = await getShopProducts(shopId)
  
  // Debug information for development
  console.log(`🔍 Shop Products Debug: Shop ${shop.name} (${shop.id}) has ${products.length} products`)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendor/shop">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <h1 className="text-2xl font-bold">{shop.name} - Products</h1>
          </div>
          <p className="text-muted-foreground">
            Manage products for this shop • {products.length} total products
          </p>
        </div>
        <Link href="/vendor/products/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first product to start selling in this shop
            </p>
            <Link href="/vendor/products/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <Image
                    src={product.imageUrls[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    onError={() => {
                      console.error('Image load error for product:', product.id, 'URL:', product.imageUrls[0])
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/products/${product.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Product
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/vendor/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Product
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <CardHeader className="space-y-2">
                <div className="space-y-1">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(Number(product.price))}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{product._count.orderItems} orders</span>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ShopProductsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Shop Products</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <ShopProductsContentWrapper params={params} />
    </Suspense>
  )
}

async function ShopProductsContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShopProductsContent shopId={id} />
}