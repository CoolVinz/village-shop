import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Edit, Eye, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'

async function getVendorProducts(userId: string) {
  return await prisma.product.findMany({
    where: {
      shop: {
        ownerId: userId
      }
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

export default async function VendorProductsPage() {
  // Use NextAuth session only
  const session = await getServerSession(authOptions) as AuthSession | null
  
  if (!session?.user) {
    redirect('/auth/login?redirect=/vendor/products')
  }
  
  const user = session.user

  // Check if user has vendor role
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/auth/login?error=insufficient_permissions')
  }

  // Get products for the authenticated user
  const products = await getVendorProducts(user.id)
  
  // Debug information for development
  console.log(`🔍 Vendor Products Debug: Authenticated user ${user.name} (${user.id}), found ${products.length} products`)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">
            Manage your product catalog across all shops • Logged in as {user.name}
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
              Add your first product to start selling in the village marketplace
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
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
                <div className="absolute top-2 left-2">
                  <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/vendor/products/${product.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/vendor/products/${product.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      ฿{product.price.toNumber()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{product.shop.name}</span>
                    <span>{product._count.orderItems} orders</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}