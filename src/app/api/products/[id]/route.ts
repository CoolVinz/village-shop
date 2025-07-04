import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { findProductBySlugOrId } from '@/lib/db-helpers'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(1).optional(),
  stock: z.number().min(0).int().optional(),
  category: z.string().optional().nullable(),
  shopId: z.string().min(1).optional(),
  isAvailable: z.boolean().optional(),
  imageUrls: z.array(z.string().url()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 API: Fetching product with slug/ID:', id)
    
    const foundProduct = await findProductBySlugOrId(id)
    if (!foundProduct) {
      console.log('❌ API: Product not found in database')
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await prisma.product.findUnique({
      where: { id: foundProduct.id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            isActive: true,
            owner: {
              select: {
                id: true,
                name: true,
                isActive: true,
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

    console.log('📦 API: Product found:', product ? 'YES' : 'NO')
    if (product) {
      console.log('🖼️ API: Product images:', product.imageUrls)
    }

    if (!product) {
      console.log('❌ API: Product not found in database')
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product, shop, or owner is inactive (for public access)
    if (!product.isAvailable || !product.shop.isActive || !product.shop.owner.isActive) {
      console.log('❌ API: Product/shop/owner inactive')
      return NextResponse.json({ error: 'Product not available' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('❌ API: Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find product by slug or ID
    const foundProduct = await findProductBySlugOrId(id)
    if (!foundProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product exists and user owns it
    const existingProduct = await prisma.product.findUnique({
      where: { id: foundProduct.id },
      include: {
        shop: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify ownership (only shop owner or admin can edit)
    if (existingProduct.shop.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - You can only edit products from your own shops' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // If shopId is being changed, verify the user owns the new shop
    if (validatedData.shopId && validatedData.shopId !== existingProduct.shopId) {
      const newShop = await prisma.shop.findUnique({
        where: { id: validatedData.shopId }
      })

      if (!newShop || (newShop.ownerId !== user.id && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'You can only assign products to your own shops' }, { status: 403 })
      }
    }

    const product = await prisma.product.update({
      where: { id: foundProduct.id },
      data: validatedData,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find product by slug or ID
    const foundProduct = await findProductBySlugOrId(id)
    if (!foundProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product exists and user owns it
    const existingProduct = await prisma.product.findUnique({
      where: { id: foundProduct.id },
      include: {
        shop: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify ownership (only shop owner or admin can delete)
    if (existingProduct.shop.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - You can only delete products from your own shops' }, { status: 403 })
    }

    await prisma.product.delete({
      where: { id: foundProduct.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}