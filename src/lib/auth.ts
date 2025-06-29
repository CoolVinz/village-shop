import { prisma, connectWithRetry } from './prisma'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Custom session user type (used by NextAuth)
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

// Keep verifyToken for API route compatibility (some routes still use JWT)
export function verifyToken(_token: string): SessionUser | null {
  // Legacy JWT verification disabled - all API routes should use NextAuth
  // This function returns null to maintain compatibility while forcing NextAuth usage
  return null
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

// NOTE: LINE OAuth integration now handled by NextAuth.js
// Legacy LINE functions removed to avoid conflicts with NextAuth.js LINE provider

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