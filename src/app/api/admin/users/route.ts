import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth/next'
// import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  houseNumber: z.string().min(1, 'House number is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR', 'ADMIN']).default('CUSTOMER'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

async function checkAdminAccess() {
  // Simplified auth check for now
  return true
}

export async function GET() {
  try {
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        shops: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    // Check if house number already exists
    const existingHouse = await prisma.user.findUnique({
      where: { houseNumber: validatedData.houseNumber }
    })

    if (existingHouse) {
      return NextResponse.json({ error: 'House number already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        username: validatedData.username,
        houseNumber: validatedData.houseNumber,
        phone: validatedData.phone,
        address: validatedData.address,
        role: validatedData.role as UserRole,
        password: hashedPassword,
        isActive: true,
        profileComplete: true,
      },
      include: {
        shops: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}