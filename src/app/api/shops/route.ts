import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createShopSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  houseNumber: z.string().min(1),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createShopSchema.parse(body)

    // Check if user already has a shop with this name
    const existingShop = await prisma.shop.findFirst({
      where: {
        ownerId: session.user.id,
        name: validatedData.name,
      }
    })

    if (existingShop) {
      return NextResponse.json(
        { error: 'You already have a shop with this name' },
        { status: 400 }
      )
    }

    const shop = await prisma.shop.create({
      data: {
        ...validatedData,
        ownerId: session.user.id,
      },
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
    console.error('Error creating shop:', error)
    
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
    const ownerId = searchParams.get('ownerId')

    let shops

    if (ownerId) {
      // Handle "current" ownerId for authenticated user
      if (ownerId === 'current') {
        const session = await getServerSession(authOptions)
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        shops = await prisma.shop.findMany({
          where: { ownerId: session.user.id },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                houseNumber: true,
              }
            },
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
      } else {
        // Get shops for specific owner (vendor dashboard)
        shops = await prisma.shop.findMany({
          where: { ownerId },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                houseNumber: true,
              }
            },
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
    } else {
      // Get all active shops (customer view)
      shops = await prisma.shop.findMany({
        where: { isActive: true },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              houseNumber: true,
            }
          },
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

    return NextResponse.json(shops)
  } catch (error) {
    console.error('Error fetching shops:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}