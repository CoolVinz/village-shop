import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, MapPin, Package, Edit } from 'lucide-react'
import Image from 'next/image'

async function getVendorShops(userId: string) {
  return await prisma.shop.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: {
          products: true,
          orderItems: true,
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

export default async function VendorShopsPage() {
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
    redirect('/auth/login?redirect=/vendor/shop')
  }

  // Check if user has vendor role
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/auth/login?error=insufficient_permissions')
  }

  // Get shops for the authenticated user
  const shops = await getVendorShops(user.id)
  
  // Debug information for development
  console.log(`🔍 Vendor Shops Debug: Authenticated user ${user.name} (${user.id}), found ${shops.length} shops`)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shops</h1>
          <p className="text-gray-600">
            Manage your village shops and their settings • Logged in as {user.name}
          </p>
        </div>
        <Link href="/vendor/shop/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Shop
          </Button>
        </Link>
      </div>

      {shops.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No shops yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first shop to start selling in the village marketplace
            </p>
            <Link href="/vendor/shop/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Shop
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card key={shop.id} className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 relative">
                {shop.logoUrl ? (
                  <Image
                    src={shop.logoUrl}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Store className="h-12 w-12 text-blue-400" />
                  </div>
                )}
                <Badge 
                  className="absolute top-2 right-2"
                  variant={shop.isActive ? 'default' : 'secondary'}
                >
                  {shop.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {shop.name}
                  <Link href={`/vendor/shop/${shop.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {shop.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    House #{shop.houseNumber}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      {shop._count.products} products
                    </div>
                    <div className="text-gray-500">
                      {shop._count.orderItems} orders
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Link href={`/vendor/shop/${shop.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Shop
                      </Button>
                    </Link>
                    <Link href={`/vendor/shop/${shop.id}/products`} className="flex-1">
                      <Button className="w-full">
                        Manage Products
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}