'use client'

import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import { AuthProvider } from '@/hooks/useAuth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster />
      </CartProvider>
    </AuthProvider>
  )
}