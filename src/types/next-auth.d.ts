declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
      houseNumber?: string | null
      phone?: string | null
      profileComplete: boolean
      lineId?: string | null
    }
  }

  interface User {
    role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
    houseNumber?: string | null
    profileComplete: boolean
    lineId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
    houseNumber?: string | null
    profileComplete: boolean
  }
}