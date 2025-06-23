import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// AUTHENTICATION COMPLETELY DISABLED FOR DEVELOPMENT
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

const createShopSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  houseNumber: z.string().min(1),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Shop creation API called')
    
    // TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Mock session for development
    const session = {
      user: {
        id: 'dev-user-1',
        name: 'Development User',
        role: 'VENDOR'
      }
    }

    const body = await request.json()
    console.log('📝 Received shop data:', body)
    
    const validatedData = createShopSchema.parse(body)
    console.log('✅ Validated shop data:', validatedData)

    // Check if user already has a shop with this name
    console.log('🔍 Checking for existing shop with name:', validatedData.name, 'for user:', session.user.id)
    
    const existingShop = await prisma.shop.findFirst({
      where: {
        ownerId: session.user.id,
        name: validatedData.name,
      }
    })

    if (existingShop) {
      console.log('❌ Shop already exists:', existingShop)
      return NextResponse.json(
        { error: 'You already have a shop with this name' },
        { status: 400 }
      )
    }

    console.log('✅ Creating new shop...')
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

    console.log('🎉 Shop created successfully:', shop)
    return NextResponse.json(shop)
  } catch (error) {
    console.error('❌ Error creating shop:', error)
    
    if (error instanceof z.ZodError) {
      console.error('📋 Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    // Check for Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('🗄️ Database error code:', error.code)
      
      // Handle common Prisma errors
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A shop with this information already exists' },
          { status: 400 }
        )
      }
      
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid user reference - user may not exist' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
        // TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
        // const session = await getServerSession(authOptions)
        // if (!session) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        // }
        
        // Mock session for development
        const mockUserId = 'dev-user-1'
        
        shops = await prisma.shop.findMany({
          where: { ownerId: mockUserId },
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