import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyToken, isVendor, isAdmin } from '@/lib/auth'

const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  price: z.number().min(0.01),
  stock: z.number().min(0).int(),
  category: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(5).default([]),
  shopId: z.string().min(1),
  isAvailable: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }
    
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }
    
    // Check if user has permission to create products (VENDOR or ADMIN)
    if (!isVendor(user.role) && !isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only vendors and admins can create products' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Verify shop ownership
    const shop = await prisma.shop.findUnique({
      where: { id: validatedData.shopId }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    if (shop.ownerId !== user.id && !isAdmin(user.role)) {
      return NextResponse.json({ error: 'You do not own this shop' }, { status: 403 })
    }

    const product = await prisma.product.create({
      data: validatedData,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                houseNumber: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const available = searchParams.get('available')

    const whereClause: Record<string, unknown> = {}

    if (shopId) {
      whereClause.shopId = shopId
    }

    if (category) {
      whereClause.category = {
        contains: category,
        mode: 'insensitive'
      }
    }

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    if (available === 'true') {
      whereClause.isAvailable = true
      whereClause.stock = {
        gt: 0
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            houseNumber: true,
            owner: {
              select: {
                id: true,
                name: true,
                houseNumber: true,
              }
            }
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

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}