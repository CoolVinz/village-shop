import { NextRequest, NextResponse } from 'next/server'
import { getLineProfile, findOrCreateLineUser, generateToken } from '@/lib/auth'

const LINE_CLIENT_ID = process.env.LINE_CLIENT_ID
const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // TODO: Validate state parameter for security

    if (!code) {
      console.error('No authorization code received from LINE')
      return NextResponse.redirect(`${NEXTAUTH_URL}/auth/error?error=no_code`)
    }

    if (!LINE_CLIENT_ID || !LINE_CLIENT_SECRET) {
      console.error('LINE OAuth credentials not configured')
      return NextResponse.redirect(`${NEXTAUTH_URL}/auth/error?error=config`)
    }

    // Exchange code for access token
    console.log('🔍 Exchanging LINE authorization code for access token')
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${NEXTAUTH_URL}/api/auth/line/callback`,
        client_id: LINE_CLIENT_ID,
        client_secret: LINE_CLIENT_SECRET,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', await tokenResponse.text())
      return NextResponse.redirect(`${NEXTAUTH_URL}/auth/error?error=token_exchange`)
    }

    const { access_token } = await tokenResponse.json()
    console.log('✅ Successfully obtained LINE access token')

    // Get user profile from LINE
    const lineProfile = await getLineProfile(access_token)
    if (!lineProfile) {
      console.error('Failed to get LINE user profile')
      return NextResponse.redirect(`${NEXTAUTH_URL}/auth/error?error=profile_fetch`)
    }

    console.log('🔍 LINE profile received:', {
      userId: lineProfile.userId,
      displayName: lineProfile.displayName,
      hasProfilePicture: !!lineProfile.pictureUrl,
    })

    // Find or create user in our database
    const user = await findOrCreateLineUser(lineProfile)
    if (!user) {
      console.error('Failed to create or find user in database')
      return NextResponse.redirect(`${NEXTAUTH_URL}/auth/error?error=user_creation`)
    }

    console.log('✅ User processed:', {
      id: user.id,
      name: user.name,
      profileComplete: user.profileComplete,
    })

    // Generate JWT token
    const token = generateToken(user)

    // Create response with redirect
    let redirectUrl = '/'
    if (!user.profileComplete) {
      redirectUrl = '/auth/complete-profile'
    }

    const response = NextResponse.redirect(`${NEXTAUTH_URL}${redirectUrl}`)

    // Set HTTP-only cookie for session
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log(`✅ LOGIN SUCCESS: Redirecting to ${redirectUrl}`)
    return response

  } catch (error) {
    console.error('LINE OAuth callback error:', error)
    return NextResponse.redirect(`${NEXTAUTH_URL}/auth/error?error=callback_error`)
  }
}