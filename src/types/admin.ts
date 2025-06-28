import { UserRole } from '@prisma/client'

export interface UserWithRelations {
  id: string
  name: string
  username: string | null
  houseNumber: string | null
  phone: string | null
  address: string | null
  role: UserRole
  isActive: boolean
  lineId: string | null
  email: string | null
  image: string | null
  profileComplete: boolean
  createdAt: Date
  updatedAt: Date
  shops: {
    id: string
    name: string
    isActive: boolean
  }[]
  orders: {
    id: string
    totalAmount: number
    status: string
  }[]
}