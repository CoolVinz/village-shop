import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const updateShopSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  houseNumber: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shop = await prisma.shop.findUnique({
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
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            products: true,
            orderItems: true,
          }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Check if shop or owner is inactive for public access
    if (!shop.isActive || !shop.owner.isActive) {
      return NextResponse.json({ error: 'Shop not available' }, { status: 404 })
    }

    return NextResponse.json(shop)
  } catch (error) {
    console.error('Error fetching shop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Check if shop exists and user owns it
    const existingShop = await prisma.shop.findUnique({
      where: { id }
    })

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Verify ownership (only shop owner or admin can edit)
    if (existingShop.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - You can only edit your own shops' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateShopSchema.parse(body)

    const shop = await prisma.shop.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(shop)
  } catch (error) {
    console.error('Error updating shop:', error)
    
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

    // Check if shop exists and user owns it
    const existingShop = await prisma.shop.findUnique({
      where: { id }
    })

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Verify ownership (only shop owner or admin can delete)
    if (existingShop.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own shops' }, { status: 403 })
    }

    await prisma.shop.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}