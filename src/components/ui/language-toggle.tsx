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
    // Remove current locale from pathname if it exists
    const segments = pathname.split('/').filter(Boolean)
    const hasLocaleInPath = segments[0] === 'th' || segments[0] === 'en'
    
    let newPathname = pathname
    if (hasLocaleInPath) {
      // Replace current locale with new one
      segments[0] = newLocale
      newPathname = '/' + segments.join('/')
    } else {
      // Add locale to path if not default
      if (newLocale !== 'th') {
        newPathname = '/' + newLocale + pathname
      }
    }
    
    // Handle default locale (Thai)
    if (newLocale === 'th') {
      // Remove locale prefix for default locale
      if (hasLocaleInPath && segments[0] === 'th') {
        segments.shift()
        newPathname = '/' + segments.join('/')
      }
    }
    
    router.push(newPathname)
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