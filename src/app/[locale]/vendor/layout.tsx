'use client'

import { VendorSidebar } from '@/components/vendor/sidebar'
import { VendorHeader } from '@/components/vendor/header'
import { AuthGuard } from '@/components/auth/auth-guard'
import { UserRole } from '@prisma/client'

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRoles={[UserRole.VENDOR, UserRole.ADMIN]}>
      <div className="flex min-h-screen bg-gray-50">
        <VendorSidebar />
        <div className="flex-1 flex flex-col">
          <VendorHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}