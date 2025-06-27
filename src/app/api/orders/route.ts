import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const orderItemSchema = z.object({
  productId: z.string().min(1),
  shopId: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0)
})

const createOrderSchema = z.object({
  deliveryTime: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number().min(0)
})

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Order placement API called')
    
    // CRITICAL: Authentication required for all order creation
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required to place orders' },
        { status: 401 }
      )
    }

    // Verify user has completed profile setup
    if (!session.user.profileComplete) {
      console.log('❌ User profile incomplete')
      return NextResponse.json(
        { error: 'Please complete your profile before placing orders' },
        { status: 400 }
      )
    }

    // Only customers can place orders
    if (session.user.role !== 'CUSTOMER') {
      console.log('❌ Non-customer trying to place order:', session.user.role)
      return NextResponse.json(
        { error: 'Only customers can place orders' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)
    
    console.log('✅ Authenticated order from user:', {
      userId: session.user.id,
      houseNumber: session.user.houseNumber,
      itemCount: validatedData.items.length
    })

    // Additional business logic validation for delivery time
    if (validatedData.deliveryTime) {
      const deliveryDate = new Date(validatedData.deliveryTime)
      const now = new Date()
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      
      if (deliveryDate < twoHoursFromNow) {
        return NextResponse.json(
          { error: 'Delivery time must be at least 2 hours from now' },
          { status: 400 }
        )
      }
      
      // Check business hours (9 AM - 6 PM) in Thailand timezone (UTC+7)
      const thailandOffset = 7 * 60 // Thailand is UTC+7
      const thailandTime = new Date(deliveryDate.getTime() + (thailandOffset * 60 * 1000))
      const hour = thailandTime.getUTCHours()
      
      console.log('🕐 Delivery time validation:', {
        originalUTC: deliveryDate.toISOString(),
        thailandTime: thailandTime.toISOString(),
        hour: hour
      })
      
      if (hour < 9 || hour >= 18) {
        return NextResponse.json(
          { error: `Delivery time must be between 9 AM and 6 PM Thailand time. Selected time: ${hour}:${thailandTime.getUTCMinutes().toString().padStart(2, '0')}` },
          { status: 400 }
        )
      }
    }

    // Use authenticated customer - no more insecure user creation
    const customer = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!customer) {
      console.log('❌ Authenticated user not found in database')
      return NextResponse.json(
        { error: 'User account not found. Please log in again.' },
        { status: 400 }
      )
    }

    if (!customer.houseNumber) {
      console.log('❌ Customer missing house number')
      return NextResponse.json(
        { error: 'House number required. Please update your profile.' },
        { status: 400 }
      )
    }

    // Validate products exist and have sufficient stock
    console.log('📦 Validating products and stock')
    for (const item of validatedData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { shop: true }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 400 }
        )
      }

      if (!product.isAvailable || !product.shop.isActive) {
        return NextResponse.json(
          { error: `Product "${product.name}" is not available` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Only ${product.stock} available` },
          { status: 400 }
        )
      }

      if (product.shopId !== item.shopId) {
        return NextResponse.json(
          { error: `Product "${product.name}" does not belong to the specified shop` },
          { status: 400 }
        )
      }
    }

    // Create the order using a transaction
    console.log('🎯 Creating order with transaction')
    const result = await prisma.$transaction(async (tx) => {
      // Create the main order
      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          customerHouseNumber: customer.houseNumber,
          deliveryTime: validatedData.deliveryTime ? new Date(validatedData.deliveryTime) : null,
          totalAmount: validatedData.totalAmount,
          notes: validatedData.notes,
          status: 'PENDING'
        }
      })

      // Create order items and update product stock
      const orderItems = []
      for (const item of validatedData.items) {
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            shopId: item.shopId,
            quantity: item.quantity,
            price: item.price,
            status: 'PENDING'
          }
        })
        orderItems.push(orderItem)

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      return { order, orderItems }
    })

    console.log('🎉 Order created successfully:', result.order)

    // Fetch the complete order with relations for response
    const completeOrder = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            houseNumber: true,
            phone: true
          }
        },
        orderItems: {
          include: {
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
        }
      }
    })

    return NextResponse.json(completeOrder)
  } catch (error) {
    console.error('❌ Error creating order:', error)
    
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
      
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Duplicate order detected' },
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
    console.log('🔍 Orders API GET called')
    
    // CRITICAL: Authentication required for all order access
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = session.user
    console.log('👤 Authenticated user:', { id: user.id, name: user.name, role: user.role })

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const houseNumber = searchParams.get('houseNumber')

    // CRITICAL: Authorization checks based on user role and requested data
    if (user.role === 'ADMIN') {
      // Admins can access any orders
      console.log('🔑 Admin access granted')
    } else if (user.role === 'CUSTOMER') {
      // Customers can only access their own orders
      if (customerId && customerId !== user.id) {
        console.log('❌ Customer trying to access other customer orders:', { userId: user.id, requestedCustomerId: customerId })
        return NextResponse.json(
          { error: 'Unauthorized: You can only access your own orders' },
          { status: 403 }
        )
      }
      
      if (houseNumber && user.houseNumber !== houseNumber) {
        console.log('❌ Customer trying to access different house number:', { userHouse: user.houseNumber, requestedHouse: houseNumber })
        return NextResponse.json(
          { error: 'Unauthorized: You can only access orders from your house number' },
          { status: 403 }
        )
      }
    } else if (user.role === 'VENDOR') {
      // Vendors should use a different endpoint for their orders
      return NextResponse.json(
        { error: 'Vendors should use the vendor orders endpoint' },
        { status: 403 }
      )
    } else {
      return NextResponse.json(
        { error: 'Unauthorized role' },
        { status: 403 }
      )
    }

    let orders

    if (customerId) {
      // For authenticated customers, double-check authorization
      if (user.role === 'CUSTOMER' && customerId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized: Customer ID mismatch' },
          { status: 403 }
        )
      }
      
      console.log('📋 Fetching orders by customer ID:', customerId)
      orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              houseNumber: true,
              phone: true
            }
          },
          orderItems: {
            include: {
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (houseNumber) {
      // For house number queries, verify authorization
      if (user.role === 'CUSTOMER' && user.houseNumber !== houseNumber) {
        return NextResponse.json(
          { error: 'Unauthorized: House number mismatch' },
          { status: 403 }
        )
      }
      
      console.log('🏠 Fetching orders by house number:', houseNumber)
      orders = await prisma.order.findMany({
        where: { customerHouseNumber: houseNumber },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              houseNumber: true,
              phone: true
            }
          },
          orderItems: {
            include: {
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // No parameters - only admins can see all orders
      if (user.role !== 'ADMIN') {
        console.log('❌ Non-admin trying to access all orders')
        return NextResponse.json(
          { error: 'Unauthorized: Only admins can view all orders' },
          { status: 403 }
        )
      }
      
      console.log('👑 Admin fetching all orders')
      orders = await prisma.order.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              houseNumber: true,
              phone: true
            }
          },
          orderItems: {
            include: {
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit for performance
      })
    }

    console.log(`✅ Returning ${orders.length} orders to user ${user.id}`)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('❌ Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}