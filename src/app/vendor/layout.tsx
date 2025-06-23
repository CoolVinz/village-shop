import { Metadata } from 'next'
// import { getServerSession } from 'next-auth'
// import { redirect } from 'next/navigation'
// import { authOptions } from '@/lib/auth'
import { VendorSidebar } from '@/components/vendor/sidebar'
import { VendorHeader } from '@/components/vendor/header'

export const metadata: Metadata = {
  title: 'Vendor Dashboard - Village Shop',
  description: 'Manage your shop and products',
}

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
  // const session = await getServerSession(authOptions)
  // if (!session) {
  //   redirect('/auth/signin')
  // }
  // if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
  //   redirect('/unauthorized')
  // }

  // Mock session for development
  const mockUser = {
    id: 'dev-user-1',
    name: 'Development User',
    email: 'dev@example.com',
    role: 'VENDOR',
    houseNumber: '123'
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VendorSidebar />
      <div className="flex-1 flex flex-col">
        <VendorHeader user={mockUser} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}