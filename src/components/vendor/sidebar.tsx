'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/vendor',
    icon: LayoutDashboard,
  },
  {
    name: 'My Shop',
    href: '/vendor/shop',
    icon: Store,
  },
  {
    name: 'Products',
    href: '/vendor/products',
    icon: Package,
  },
  {
    name: 'Orders',
    href: '/vendor/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Analytics',
    href: '/vendor/analytics',
    icon: BarChart3,
  },
  {
    name: 'Customers',
    href: '/vendor/customers',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/vendor/settings',
    icon: Settings,
  },
]

export function VendorSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">
          Village Shop
        </h1>
        <p className="text-sm text-gray-600">Vendor Dashboard</p>
      </div>

      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/vendor' && pathname.startsWith(item.href))

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto p-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900">
            Need Help?
          </h3>
          <p className="text-xs text-blue-700 mt-1">
            Contact support for assistance with your shop
          </p>
        </div>
      </div>
    </div>
  )
}