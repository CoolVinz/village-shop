import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, MapPin, Package, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'

interface ShopPageProps {
  params: Promise<{ id: string }>
}

async function getShop(id: string) {
  return await prisma.shop.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          houseNumber: true,
          isActive: true,
        }
      },
      products: {
        where: { isAvailable: true },
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
      }
    }
  })
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { id } = await params
  const shop = await getShop(id)

  if (!shop || !shop.isActive || !shop.owner.isActive) {
    notFound()
  }

  const availableProducts = shop.products.filter(product => product.stock > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/shops">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shops
            </Button>
          </Link>
        </div>

        {/* Shop Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                {shop.logoUrl ? (
                  <Image
                    src={shop.logoUrl}
                    alt={shop.name}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] bg-gray-100 rounded-lg flex items-center justify-center">
                    <Store className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {shop.name}
                </h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>House {shop.owner.houseNumber} • {shop.owner.name}</span>
                </div>
                {shop.description && (
                  <p className="text-gray-700 mb-4">{shop.description}</p>
                )}

                {/* Shop Stats */}
                <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {shop._count.products}
                    </div>
                    <div className="text-sm text-gray-500">Total Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {availableProducts.length}
                    </div>
                    <div className="text-sm text-gray-500">Available Now</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {shop._count.orderItems}
                    </div>
                    <div className="text-sm text-gray-500">Total Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Products Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Products</h2>
            <div className="text-sm text-gray-600">
              {availableProducts.length} available product{availableProducts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {availableProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products available
                </h3>
                <p className="text-gray-600">
                  This shop doesn&apos;t have any products available right now.
                  Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {availableProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">
                        {product.stock} left
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ฿{product.price.toNumber()}
                        </span>
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {product._count.orderItems} order{product._count.orderItems !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <Link href={`/products/${product.id}`}>
                      <Button className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Out of Stock Products */}
        {shop.products.filter(p => p.stock === 0 || !p.isAvailable).length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Currently Unavailable
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shop.products
                .filter(p => p.stock === 0 || !p.isAvailable)
                .map((product) => (
                  <Card key={product.id} className="overflow-hidden opacity-60">
                    <div className="aspect-square bg-gray-100 relative">
                      {product.imageUrls.length > 0 ? (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.name}
                          fill
                          className="object-cover grayscale"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive">
                          Out of Stock
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="space-y-2">
                        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            ฿{product.price.toNumber()}
                          </span>
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}