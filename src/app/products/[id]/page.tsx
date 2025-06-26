import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Store, MapPin, Package } from 'lucide-react'
import { AddToCartButton } from '@/components/product/add-to-cart-button'
import { prisma } from '@/lib/prisma'
import { findProductBySlugOrId, getProductUrl, getShopUrl } from '@/lib/db-helpers'
import Image from 'next/image'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

async function getProduct(slugOrId: string) {
  const product = await findProductBySlugOrId(slugOrId)
  
  if (!product) {
    return null
  }

  return await prisma.product.findUnique({
    where: { id: product.id },
    include: {
      shop: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              houseNumber: true,
            }
          },
          products: {
            where: {
              isAvailable: true,
              stock: {
                gt: 0
              },
              NOT: {
                id: product.id
              }
            },
            take: 4,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      },
      _count: {
        select: {
          orderItems: true
        }
      }
    }
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product || !product.isAvailable || !product.shop.isActive) {
    notFound()
  }

  const isInStock = product.stock > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
              {product.imageUrls.length > 0 ? (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Additional Images */}
            {product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imageUrls.slice(1, 5).map((imageUrl, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
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
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={isInStock ? 'default' : 'destructive'}>
                  {isInStock ? `${product.stock} in stock` : 'Out of stock'}
                </Badge>
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-4">
                ฿{product.price.toNumber()}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Shop Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {product.shop.logoUrl ? (
                      <Image
                        src={product.shop.logoUrl}
                        alt={product.shop.name}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Store className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{product.shop.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      House {product.shop.owner.houseNumber} • {product.shop.owner.name}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={getShopUrl(product.shop)}>
                  <Button variant="outline" className="w-full">
                    Visit Shop
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <AddToCartButton product={{
              id: product.id,
              name: product.name,
              price: product.price.toNumber(),
              stock: product.stock,
              imageUrls: product.imageUrls,
              shop: {
                id: product.shop.id,
                name: product.shop.name
              }
            }} />

            {/* Product Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                Total orders: {product._count.orderItems}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {product.shop.products.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              More from {product.shop.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.shop.products.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 relative">
                    {relatedProduct.imageUrls.length > 0 ? (
                      <Image
                        src={relatedProduct.imageUrls[0]}
                        alt={relatedProduct.name}
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
                        {relatedProduct.stock} left
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-1">{relatedProduct.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {relatedProduct.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ฿{relatedProduct.price.toNumber()}
                        </span>
                        {relatedProduct.category && (
                          <Badge variant="outline" className="text-xs">
                            {relatedProduct.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <Link href={getProductUrl(relatedProduct)}>
                      <Button className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}