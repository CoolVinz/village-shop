'use client'

import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingCart, 
  CreditCard,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { UserRole } from '@prisma/client'
import { useSession } from 'next-auth/react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Shops', href: '/admin/shops', icon: Store },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <AuthGuard requiredRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Navigation Header */}
        <nav className="bg-gray-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/admin" className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-400" />
                  <span className="text-xl font-bold">Admin Panel</span>
                </Link>
                <div className="ml-8 flex space-x-4">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {session && (
                  <>
                    <div className="text-sm">
                      <span className="text-gray-300">Welcome, </span>
                      <span className="font-medium">{session.user.name}</span>
                    </div>
                    <div className="text-xs bg-blue-600 px-2 py-1 rounded">
                      {session.user.role}
                    </div>
                  </>
                )}
                <Link 
                  href="/"
                  className="text-gray-300 hover:text-white text-sm"
                >
                  Back to Site
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Admin Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}