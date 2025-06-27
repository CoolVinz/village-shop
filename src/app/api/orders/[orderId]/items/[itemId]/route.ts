import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyToken } from '@/lib/auth'

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
    
    // Get authentication token from cookies
    const token = request.cookies.get('auth-token')?.value
    console.log('🔑 Auth token present:', !!token)
    
    if (!token) {
      console.log('❌ No auth token found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify the token and get user info
    const user = verifyToken(token)
    if (!user) {
      console.log('❌ Invalid auth token')
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    console.log('👤 Authenticated user:', { id: user.id, name: user.name, role: user.role })

    // Check if user has vendor role
    if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
      console.log('❌ Insufficient permissions:', user.role)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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

    console.log('🔍 Checking ownership:', { 
      shopOwnerId: orderItem.shop.ownerId, 
      userId: user.id, 
      userRole: user.role 
    })

    if (orderItem.shop.ownerId !== user.id && user.role !== 'ADMIN') {
      console.log('❌ User does not own this shop')
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
      console.log('📋 Main order status updated to CONFIRMED')
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