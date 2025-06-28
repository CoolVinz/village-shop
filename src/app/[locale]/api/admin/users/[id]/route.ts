import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth/next'
// import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  houseNumber: z.string().min(1, 'House number is required').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
})

async function checkAdminAccess() {
  // Simplified auth check for now
  return true
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const { id } = await params
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check username uniqueness if updating username
    if (validatedData.username && validatedData.username !== existingUser.username) {
      const userWithUsername = await prisma.user.findUnique({
        where: { username: validatedData.username }
      })
      if (userWithUsername) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }
    }

    // Check house number uniqueness if updating house number
    if (validatedData.houseNumber && validatedData.houseNumber !== existingUser.houseNumber) {
      const userWithHouseNumber = await prisma.user.findUnique({
        where: { houseNumber: validatedData.houseNumber }
      })
      if (userWithHouseNumber) {
        return NextResponse.json({ error: 'House number already exists' }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow deleting admin users (soft delete by deactivating instead)
    if (existingUser.role === UserRole.ADMIN) {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 400 })
    }

    // Soft delete by deactivating the user
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'User deactivated successfully', user: deactivatedUser })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}