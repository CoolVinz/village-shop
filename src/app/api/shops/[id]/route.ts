import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
    // TODO: Implement authentication check with custom auth system
    // const session = await getServerSession(authOptions)
    // 
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if shop exists and user owns it
    const existingShop = await prisma.shop.findUnique({
      where: { id }
    })

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // TODO: Re-enable ownership validation after implementing custom auth
    // if (existingShop.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

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
    // TODO: Implement authentication check with custom auth system
    // const session = await getServerSession(authOptions)
    // 
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if shop exists and user owns it
    const existingShop = await prisma.shop.findUnique({
      where: { id }
    })

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // TODO: Re-enable ownership validation after implementing custom auth
    // if (existingShop.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

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