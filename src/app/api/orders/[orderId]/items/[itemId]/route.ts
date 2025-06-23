import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// AUTHENTICATION COMPLETELY DISABLED FOR DEVELOPMENT
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

const updateOrderItemSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  notes: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const params = await context.params
    console.log('🔄 Updating order item status:', params)
    
    // TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const validatedData = updateOrderItemSchema.parse(body)

    // Verify the order item exists and belongs to vendor's shop
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: params.itemId },
      include: {
        order: true,
        shop: true,
        product: true
      }
    })

    if (!orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    if (orderItem.shop.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You do not own this shop' }, { status: 403 })
    }

    // Update the order item status
    const updatedOrderItem = await prisma.orderItem.update({
      where: { id: params.itemId },
      data: {
        status: validatedData.status
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                houseNumber: true,
                phone: true
              }
            }
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrls: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Check if all order items are delivered to update main order status
    const allOrderItems = await prisma.orderItem.findMany({
      where: { orderId: params.orderId }
    })

    const allDelivered = allOrderItems.every(item => 
      item.status === 'DELIVERED' || item.status === 'CANCELLED'
    )

    if (allDelivered) {
      await prisma.order.update({
        where: { id: params.orderId },
        data: { status: 'DELIVERED' }
      })
    } else if (validatedData.status === 'CONFIRMED' && orderItem.order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: params.orderId },
        data: { status: 'CONFIRMED' }
      })
    }

    console.log('✅ Order item status updated:', updatedOrderItem)
    return NextResponse.json(updatedOrderItem)
  } catch (error) {
    console.error('❌ Error updating order item status:', error)
    
    if (error instanceof z.ZodError) {
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const params = await context.params
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: params.itemId },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                houseNumber: true,
                phone: true
              }
            },
            paymentSlips: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrls: true,
            price: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true,
            houseNumber: true
          }
        }
      }
    })

    if (!orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    return NextResponse.json(orderItem)
  } catch (error) {
    console.error('Error fetching order item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}