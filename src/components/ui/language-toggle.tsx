'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages } from 'lucide-react'

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const handleLanguageChange = (newLocale: string) => {
    // For [locale] structure, we need to replace the locale in the path
    const segments = pathname.split('/').filter(Boolean)
    
    if (newLocale === 'th') {
      // For Thai (default), remove locale prefix
      if (segments[0] === 'th' || segments[0] === 'en') {
        segments.shift() // Remove current locale
      }
      const newPath = '/' + segments.join('/')
      router.push(newPath || '/')
    } else {
      // For English, ensure it has /en prefix
      if (segments[0] === 'th' || segments[0] === 'en') {
        segments[0] = newLocale // Replace current locale
      } else {
        segments.unshift(newLocale) // Add locale prefix
      }
      const newPath = '/' + segments.join('/')
      router.push(newPath)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('th')}
          className={locale === 'th' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇹🇭</span>
          ไทย (Thai)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇺🇸</span>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}