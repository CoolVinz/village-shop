'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatThaiDate, toBuddhistEra } from '@/lib/thai-utils'

interface ThaiDatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showBuddhistEra?: boolean
  onBuddhistEraChange?: (useBuddhistEra: boolean) => void
}

export function ThaiDatePicker({
  date,
  onDateChange,
  placeholder,
  disabled = false,
  className,
  showBuddhistEra = true,
  onBuddhistEraChange
}: ThaiDatePickerProps) {
  const t = useTranslations('time')
  const [useBuddhistEra, setUseBuddhistEra] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleBuddhistEraToggle = (checked: boolean) => {
    setUseBuddhistEra(checked)
    onBuddhistEraChange?.(checked)
  }

  const formatDisplayDate = (date: Date) => {
    if (useBuddhistEra) {
      return formatThaiDate(date, { 
        useBuddhistEra: true, 
        format: 'long' 
      })
    } else {
      return format(date, 'dd MMMM yyyy', { locale: th })
    }
  }

  const getPlaceholderText = () => {
    if (placeholder) return placeholder
    return useBuddhistEra ? 'เลือกวันที่ (พ.ศ.)' : 'เลือกวันที่ (ค.ศ.)'
  }

  return (
    <div className="space-y-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal thai-text',
              !date && 'text-muted-foreground',
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDisplayDate(date) : getPlaceholderText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            {/* Buddhist Era Toggle */}
            {showBuddhistEra && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="buddhist-era"
                  checked={useBuddhistEra}
                  onCheckedChange={handleBuddhistEraToggle}
                />
                <Label htmlFor="buddhist-era" className="text-sm thai-text">
                  {useBuddhistEra ? t('buddhist') : t('christian')}
                </Label>
              </div>
            )}
          </div>
          
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              onDateChange?.(selectedDate)
              setIsOpen(false)
            }}
            locale={th}
            disabled={disabled}
            initialFocus
          />
          
          {/* Quick date selection */}
          <div className="p-3 border-t">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  onDateChange?.(today)
                  setIsOpen(false)
                }}
                className="text-xs thai-text"
              >
                {t('today')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  onDateChange?.(tomorrow)
                  setIsOpen(false)
                }}
                className="text-xs thai-text"
              >
                {t('tomorrow')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextWeek = new Date()
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  onDateChange?.(nextWeek)
                  setIsOpen(false)
                }}
                className="text-xs thai-text"
              >
                สัปดาห์หน้า
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected date display with era info */}
      {date && (
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="thai-text">
              {useBuddhistEra ? 'พุทธศักราช:' : 'คริสต์ศักราช:'}
            </span>
            <span className="font-mono">
              {useBuddhistEra ? toBuddhistEra(date.getFullYear()) : date.getFullYear()}
            </span>
          </div>
          
          {/* Show both eras for reference */}
          <div className="text-xs text-gray-500 flex items-center justify-between thai-text">
            <span>{useBuddhistEra ? 'ค.ศ.' : 'พ.ศ.'}</span>
            <span className="font-mono">
              {useBuddhistEra ? date.getFullYear() : toBuddhistEra(date.getFullYear())}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Pre-configured variants for common use cases
export function ThaiDatePickerDelivery(props: Omit<ThaiDatePickerProps, 'showBuddhistEra'>) {
  return (
    <ThaiDatePicker
      {...props}
      showBuddhistEra={false}
      placeholder="เลือกวันที่จัดส่ง"
    />
  )
}

export function ThaiDatePickerBirthdate(props: Omit<ThaiDatePickerProps, 'showBuddhistEra'>) {
  return (
    <ThaiDatePicker
      {...props}
      showBuddhistEra={true}
      placeholder="เลือกวันเกิด"
    />
  )
}

export function ThaiDatePickerOrder(props: Omit<ThaiDatePickerProps, 'showBuddhistEra'>) {
  return (
    <ThaiDatePicker
      {...props}
      showBuddhistEra={false}
      placeholder="เลือกวันที่สั่งซื้อ"
    />
  )
}