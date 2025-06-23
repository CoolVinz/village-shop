import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, Package, MapPin, Star } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'

async function getFeaturedShops() {
  return await prisma.shop.findMany({
    where: { 
      isActive: true,
      products: {
        some: {
          isAvailable: true,
          stock: {
            gt: 0
          }
        }
      }
    },
    include: {
      owner: {
        select: {
          name: true,
          houseNumber: true,
        }
      },
      products: {
        where: {
          isAvailable: true,
          stock: {
            gt: 0
          }
        },
        take: 3,
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          products: {
            where: {
              isAvailable: true,
              stock: {
                gt: 0
              }
            }
          },
          orderItems: true
        }
      }
    },
    take: 6,
    orderBy: {
      createdAt: 'desc'
    }
  })
}

async function getFeaturedProducts() {
  return await prisma.product.findMany({
    where: {
      isAvailable: true,
      stock: {
        gt: 0
      },
      shop: {
        isActive: true
      }
    },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              houseNumber: true
            }
          }
        }
      }
    },
    take: 8,
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export default async function HomePage() {
  const [featuredShops, featuredProducts] = await Promise.all([
    getFeaturedShops(),
    getFeaturedProducts()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Village Marketplace
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Discover local shops and products from your neighbors
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shops">
                <Button size="lg" variant="secondary">
                  <Store className="mr-2 h-5 w-5" />
                  Browse Shops
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  <Package className="mr-2 h-5 w-5" />
                  View Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Shops */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Shops</h2>
            <Link href="/shops">
              <Button variant="outline">View All Shops</Button>
            </Link>
          </div>

          {featuredShops.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No shops available yet
                </h3>
                <p className="text-gray-600">
                  Check back soon for new shops from your neighbors
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredShops.map((shop) => (
                <Card key={shop.id} className="hover:shadow-lg transition-shadow">
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{shop.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          House {shop.owner.houseNumber} • {shop.owner.name}
                        </div>
                        {shop.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {shop.description}
                          </p>
                        )}
                      </div>
                      {shop.logoUrl && (
                        <Image
                          src={shop.logoUrl}
                          alt={shop.name}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover ml-3"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{shop._count.products} products</span>
                      <span>{shop._count.orderItems} orders</span>
                    </div>
                  </div>

                  {shop.products.length > 0 && (
                    <div className="p-4">
                      <h4 className="text-sm font-medium mb-2">Recent Products</h4>
                      <div className="flex gap-2">
                        {shop.products.slice(0, 3).map((product) => (
                          <div key={product.id} className="flex-1">
                            <div className="aspect-square bg-gray-100 rounded-md relative overflow-hidden">
                              {product.imageUrls.length > 0 ? (
                                <Image
                                  src={product.imageUrls[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs mt-1 line-clamp-1">{product.name}</p>
                            <p className="text-xs font-medium">฿{product.price.toNumber()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 pt-0">
                    <Link href={`/shops/${shop.id}`}>
                      <Button className="w-full">Visit Shop</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Latest Products</h2>
            <Link href="/products">
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products available yet
                </h3>
                <p className="text-gray-600">
                  Check back soon for new products from village shops
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
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
                  </div>
                  <CardHeader className="pb-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ฿{product.price.toNumber()}
                        </span>
                        <Badge variant="secondary">
                          {product.stock} left
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {product.shop.name} • House {product.shop.owner.houseNumber}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href={`/products/${product.id}`}>
                      <Button className="w-full" size="sm">
                        View Product
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
