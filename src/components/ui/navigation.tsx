'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  LogIn,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession, signIn, signOut } from 'next-auth/react'

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shops', href: '/shops' },
    { name: 'Products', href: '/products' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Village Shop
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Cart, User */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* Shopping Cart */}
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs"
              >
                0
              </Badge>
            </Button>

            {/* User Menu */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5 mr-2" />
                    {session.user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {(session.user.role === 'VENDOR' || session.user.role === 'ADMIN') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/vendor">
                          <Settings className="mr-2 h-4 w-4" />
                          Vendor Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {session.user.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => signIn()}>
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-500 hover:text-gray-900 block pl-3 pr-4 py-2 text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4 space-y-3">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart (0)
              </Button>
            </div>
            <div className="mt-3 space-y-1">
              {session ? (
                <>
                  <div className="px-4 py-2 text-sm font-medium text-gray-900">
                    {session.user.name}
                  </div>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {(session.user.role === 'VENDOR' || session.user.role === 'ADMIN') && (
                    <Link
                      href="/vendor"
                      className="block px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Vendor Dashboard
                    </Link>
                  )}
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    signIn()
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}