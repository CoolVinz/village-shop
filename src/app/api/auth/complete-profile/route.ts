import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { houseNumber, phone, address, role } = await request.json()

    if (!houseNumber) {
      return NextResponse.json({ error: 'House number is required' }, { status: 400 })
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        houseNumber,
        username: houseNumber, // Set username to house number
        phone: phone || null,
        address: address || null,
        role: role || UserRole.CUSTOMER,
        profileComplete: true,
      },
    })

    // Generate new token with updated user data
    const newToken = generateToken({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username || undefined,
      houseNumber: updatedUser.houseNumber || undefined,
      role: updatedUser.role,
      phone: updatedUser.phone || undefined,
      address: updatedUser.address || undefined,
      lineId: updatedUser.lineId || undefined,
      email: updatedUser.email || undefined,
      image: updatedUser.image || undefined,
      profileComplete: updatedUser.profileComplete,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        houseNumber: updatedUser.houseNumber,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        lineId: updatedUser.lineId,
        email: updatedUser.email,
        image: updatedUser.image,
        profileComplete: updatedUser.profileComplete,
      },
    })

    // Update the auth token cookie
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Profile completion error:', error)
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('houseNumber')) {
        return NextResponse.json(
          { error: 'House number is already registered by another user' },
          { status: 400 }
        )
      }
      if (error.message.includes('username')) {
        return NextResponse.json(
          { error: 'Username is already taken' },
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