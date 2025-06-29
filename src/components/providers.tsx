'use client'

import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import AuthSessionProvider from '@/components/providers/session-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <CartProvider>
        {children}
        <Toaster />
      </CartProvider>
    </AuthSessionProvider>
  )
}