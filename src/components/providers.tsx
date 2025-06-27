'use client'

import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import { AuthProvider } from '@/hooks/useAuth'
import AuthSessionProvider from '@/components/providers/session-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </AuthSessionProvider>
  )
}