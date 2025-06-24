import { prisma, connectWithRetry } from './prisma'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Custom session user type
export interface SessionUser {
  id: string
  name: string
  username?: string
  houseNumber?: string
  role: UserRole
  phone?: string
  address?: string
  lineId?: string
  email?: string
  image?: string
  profileComplete: boolean
}

// JWT payload type
export interface JWTPayload extends SessionUser {
  iat: number
  exp: number
}

// Environment validation
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key'
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET not set, using default (not secure for production)')
}

// Test database connection during initialization
async function testDatabaseConnection() {
  try {
    await connectWithRetry(async () => {
      await prisma.$connect()
      console.log('✅ Database connection successful')
    })
  } catch (error) {
    console.error('🚨 Database connection failed during auth initialization:', error)
  }
}

// Initialize database connection test (non-blocking)
testDatabaseConnection()

// Authentication helper functions
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function authenticateUser(username: string, password: string): Promise<SessionUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.password) {
      return null
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return null
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username || undefined,
      houseNumber: user.houseNumber || undefined,
      role: user.role,
      phone: user.phone || undefined,
      address: user.address || undefined,
      lineId: user.lineId || undefined,
      email: user.email || undefined,
      image: user.image || undefined,
      profileComplete: user.profileComplete,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// LINE OAuth helper functions
export interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export async function getLineProfile(accessToken: string): Promise<LineProfile | null> {
  try {
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('LINE profile fetch error:', error)
    return null
  }
}

export async function findOrCreateLineUser(lineProfile: LineProfile): Promise<SessionUser | null> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { lineId: lineProfile.userId }
    })

    if (existingUser) {
      return {
        id: existingUser.id,
        name: existingUser.name,
        username: existingUser.username || undefined,
        houseNumber: existingUser.houseNumber || undefined,
        role: existingUser.role,
        phone: existingUser.phone || undefined,
        address: existingUser.address || undefined,
        lineId: existingUser.lineId || undefined,
        email: existingUser.email || undefined,
        image: existingUser.image || undefined,
        profileComplete: existingUser.profileComplete,
      }
    }

    // Create new user with LINE profile
    const newUser = await prisma.user.create({
      data: {
        name: lineProfile.displayName,
        lineId: lineProfile.userId,
        image: lineProfile.pictureUrl,
        email: `${lineProfile.userId}@line.me`,
        role: UserRole.CUSTOMER,
        profileComplete: false, // User needs to complete profile
        isActive: true,
      },
    })

    return {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username || undefined,
      houseNumber: newUser.houseNumber || undefined,
      role: newUser.role,
      phone: newUser.phone || undefined,
      address: newUser.address || undefined,
      lineId: newUser.lineId || undefined,
      email: newUser.email || undefined,
      image: newUser.image || undefined,
      profileComplete: newUser.profileComplete,
    }
  } catch (error) {
    console.error('LINE user creation error:', error)
    return null
  }
}

export async function createUser(userData: {
  name: string
  username: string
  password: string
  houseNumber: string
  phone?: string
  address?: string
  role?: UserRole
}): Promise<SessionUser | null> {
  try {
    const hashedPassword = await hashPassword(userData.password)

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        username: userData.username,
        password: hashedPassword,
        houseNumber: userData.houseNumber,
        phone: userData.phone,
        address: userData.address,
        role: userData.role || UserRole.CUSTOMER,
        isActive: true,
      },
    })

    return {
      id: user.id,
      name: user.name,
      username: user.username || undefined,
      houseNumber: user.houseNumber || undefined,
      role: user.role,
      phone: user.phone || undefined,
      address: user.address || undefined,
      profileComplete: user.profileComplete,
    }
  } catch (error) {
    console.error('User creation error:', error)
    return null
  }
}

// Helper functions for role-based access control
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}

export function isVendor(userRole: UserRole): boolean {
  return userRole === UserRole.VENDOR
}

export function isCustomer(userRole: UserRole): boolean {
  return userRole === UserRole.CUSTOMER
}

export function canAccessVendorDashboard(userRole: UserRole): boolean {
  return userRole === UserRole.VENDOR || userRole === UserRole.ADMIN
}

export function canAccessAdminPanel(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}