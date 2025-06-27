import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const completeProfileSchema = z.object({
  houseNumber: z.string().min(1, 'House number is required').max(10, 'House number too long'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR']).optional().default('CUSTOMER'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Profile completion API called')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = completeProfileSchema.parse(body)
    
    console.log('✅ Profile data validated:', {
      userId: session.user.id,
      houseNumber: validatedData.houseNumber,
      role: validatedData.role,
    })

    // Check if house number is already taken
    const existingUser = await prisma.user.findUnique({
      where: { houseNumber: validatedData.houseNumber },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      console.log('❌ House number already taken:', validatedData.houseNumber)
      return NextResponse.json(
        { error: 'House number is already registered by another user' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        houseNumber: validatedData.houseNumber,
        phone: validatedData.phone,
        role: validatedData.role,
        profileComplete: true,
        // Set username to house number if not already set
        username: !existingUser?.username ? validatedData.houseNumber : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        houseNumber: true,
        phone: true,
        role: true,
        profileComplete: true,
      },
    })

    console.log('✅ Profile completed successfully:', updatedUser.id)

    return NextResponse.json({
      message: 'Profile completed successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('❌ Error completing profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    // Check for Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'House number is already registered' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}