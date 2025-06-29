'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CartSidebar } from '@/components/cart/cart-sidebar'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { 
  Menu, 
  X,
  LogIn,
  LogOut,
  User,
  Shield
} from 'lucide-react'
import { useNextAuth } from '@/hooks/useNextAuth'

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useNextAuth()
  const t = useTranslations('navigation')
  const tAuth = useTranslations('auth')

  const navigation = [
    { name: t('home'), href: '/' },
    { name: t('shops'), href: '/shops' },
    { name: t('products'), href: '/products' },
    ...(user?.role === 'CUSTOMER' 
      ? [{ name: t('orders'), href: '/orders' }] 
      : []
    ),
    ...(user?.role === 'VENDOR' || user?.role === 'ADMIN' 
      ? [{ name: t('dashboard'), href: '/vendor' }] 
      : []
    ),
    ...(user?.role === 'ADMIN' 
      ? [{ name: t('admin'), href: '/admin' }] 
      : []
    ),
  ]

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 thai-text">
                ร้านค้าชาวบ้าน
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

          {/* Right side - Language, Cart, Authentication */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* Shopping Cart */}
            <CartSidebar />

            {/* Authentication Section */}
            {!user && (
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  {tAuth('login')}
                </Button>
              </Link>
            )}

            {user && (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-gray-500 flex items-center">
                      {user.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role}
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {tAuth('signOut')}
                </Button>
              </div>
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
            <div className="flex items-center px-4 space-x-3">
              <CartSidebar />
              
              {/* Language Toggle */}
              <LanguageToggle />
              
              {/* Mobile Authentication */}
              {!user && (
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    {tAuth('login')}
                  </Button>
                </Link>
              )}
            </div>
            
            {user && (
              <div className="mt-3 px-4">
                <div className="flex items-center space-x-2 pb-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-gray-500 flex items-center">
                      {user.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {tAuth('signOut')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}