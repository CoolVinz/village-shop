import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// AUTHENTICATION COMPLETELY DISABLED FOR DEVELOPMENT
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

const orderItemSchema = z.object({
  productId: z.string().min(1),
  shopId: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0)
})

const createOrderSchema = z.object({
  customerId: z.string().optional().nullable(), // For authenticated users
  customerName: z.string().min(1).max(100),
  customerHouseNumber: z.string().min(1).max(10),
  customerPhone: z.string().min(1).max(20),
  deliveryTime: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number().min(0)
})

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Order placement API called')
    
    const body = await request.json()
    console.log('📝 Received order data:', body)
    
    const validatedData = createOrderSchema.parse(body)
    console.log('✅ Validated order data:', validatedData)

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
      
      // Check business hours (9 AM - 6 PM)
      const hour = deliveryDate.getHours()
      if (hour < 9 || hour >= 18) {
        return NextResponse.json(
          { error: 'Delivery time must be between 9 AM and 6 PM' },
          { status: 400 }
        )
      }
    }

    // Handle customer user - prefer authenticated user if provided
    let customer
    
    if (validatedData.customerId) {
      // User is authenticated, use their ID
      console.log('👤 Using authenticated customer:', validatedData.customerId)
      customer = await prisma.user.findUnique({
        where: { id: validatedData.customerId }
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Authenticated user not found' },
          { status: 400 }
        )
      }

      // Update customer info from form (in case user updated details)
      customer = await prisma.user.update({
        where: { id: customer.id },
        data: {
          name: validatedData.customerName,
          houseNumber: validatedData.customerHouseNumber,
          phone: validatedData.customerPhone
        }
      })
    } else {
      // No authenticated user, find or create by house number
      customer = await prisma.user.findUnique({
        where: { houseNumber: validatedData.customerHouseNumber }
      })

      if (!customer) {
        console.log('👤 Creating new customer user')
        customer = await prisma.user.create({
          data: {
            name: validatedData.customerName,
            houseNumber: validatedData.customerHouseNumber,
            phone: validatedData.customerPhone,
            role: 'CUSTOMER'
          }
        })
      } else {
        // Update customer info if needed
        console.log('👤 Updating existing customer info')
        customer = await prisma.user.update({
          where: { id: customer.id },
          data: {
            name: validatedData.customerName,
            phone: validatedData.customerPhone
          }
        })
      }
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
          customerHouseNumber: validatedData.customerHouseNumber,
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
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const houseNumber = searchParams.get('houseNumber')

    let orders

    if (customerId) {
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
      // Return all orders (for admin purposes)
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

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}