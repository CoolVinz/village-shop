import { redirect } from 'next/navigation'
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

// TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
  // const session = await getServerSession(authOptions)
  
  // Mock admin session for development
  const session = {
    user: {
      id: 'admin-user-1',
      name: 'System Administrator',
      role: 'ADMIN'
    }
  }
  
  // if (!session || session.user.role !== 'ADMIN') {
  //   redirect('/vendor') // Redirect non-admins to vendor dashboard
  // }

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
              <div className="text-sm">
                <span className="text-gray-300">Welcome, </span>
                <span className="font-medium">{session.user.name}</span>
              </div>
              <div className="text-xs bg-blue-600 px-2 py-1 rounded">
                {session.user.role}
              </div>
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
  )
}