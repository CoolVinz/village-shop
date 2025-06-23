import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// AUTHENTICATION COMPLETELY DISABLED FOR DEVELOPMENT
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

const createPaymentSlipSchema = z.object({
  orderId: z.string().min(1),
  imageUrl: z.string().url(),
  notes: z.string().optional().nullable()
})

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Payment slip upload API called')
    
    const body = await request.json()
    console.log('📝 Received payment slip data:', body)
    
    const validatedData = createPaymentSlipSchema.parse(body)
    console.log('✅ Validated payment slip data:', validatedData)

    // Verify the order exists
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            houseNumber: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if payment slip already exists for this order
    const existingPaymentSlip = await prisma.paymentSlip.findFirst({
      where: { orderId: validatedData.orderId }
    })

    if (existingPaymentSlip) {
      return NextResponse.json(
        { error: 'Payment slip already exists for this order' },
        { status: 400 }
      )
    }

    // Create the payment slip
    console.log('💰 Creating payment slip')
    const paymentSlip = await prisma.paymentSlip.create({
      data: {
        orderId: validatedData.orderId,
        imageUrl: validatedData.imageUrl,
        notes: validatedData.notes,
        status: 'PENDING'
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                houseNumber: true
              }
            }
          }
        }
      }
    })

    console.log('🎉 Payment slip created successfully:', paymentSlip)
    return NextResponse.json(paymentSlip)
  } catch (error) {
    console.error('❌ Error creating payment slip:', error)
    
    if (error instanceof z.ZodError) {
      console.error('📋 Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
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
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    let paymentSlips

    if (orderId) {
      paymentSlips = await prisma.paymentSlip.findMany({
        where: { orderId },
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  houseNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      const whereClause: Record<string, unknown> = {}
      
      if (status) {
        whereClause.status = status
      }

      paymentSlips = await prisma.paymentSlip.findMany({
        where: whereClause,
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  houseNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit for performance
      })
    }

    return NextResponse.json(paymentSlips)
  } catch (error) {
    console.error('Error fetching payment slips:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}