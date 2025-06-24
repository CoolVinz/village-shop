import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { name, username, password, houseNumber, phone, address, role } = await request.json()

    if (!name || !username || !password || !houseNumber) {
      return NextResponse.json(
        { error: 'Name, username, password, and house number are required' },
        { status: 400 }
      )
    }

    // Validate username format (should be house number like "123/4")
    if (username !== houseNumber) {
      return NextResponse.json(
        { error: 'Username must match house number' },
        { status: 400 }
      )
    }

    const user = await createUser({
      name,
      username,
      password,
      houseNumber,
      phone,
      address,
      role: role || UserRole.CUSTOMER,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user. Username or house number may already exist.' },
        { status: 400 }
      )
    }

    const token = generateToken(user)

    // Set HTTP-only cookie for session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        houseNumber: user.houseNumber,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}