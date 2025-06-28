// Thai localization utilities

/**
 * Format currency in Thai Baht
 */
export function formatThaiBaht(amount: number): string {
  return `฿${amount.toLocaleString('th-TH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

/**
 * Format date in Thai style with Buddhist Era option
 */
export function formatThaiDate(date: Date, options: {
  useBuddhistEra?: boolean
  includeTime?: boolean
  format?: 'short' | 'long' | 'full'
} = {}): string {
  const { useBuddhistEra = false, includeTime = false, format = 'short' } = options
  
  let dateString: string
  
  if (format === 'full') {
    dateString = date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } else if (format === 'long') {
    dateString = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } else {
    dateString = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  
  if (includeTime) {
    const timeString = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })
    dateString += ` ${timeString} น.`
  }
  
  // Convert to Buddhist Era if requested
  if (useBuddhistEra) {
    const year = date.getFullYear()
    const buddhistYear = year + 543
    dateString = dateString.replace(year.toString(), buddhistYear.toString())
  }
  
  return dateString
}

/**
 * Format Thai address according to standard conventions
 */
export function formatThaiAddress(address: {
  houseNumber?: string
  village?: string
  road?: string
  subdistrict?: string
  district?: string
  province?: string
  postalCode?: string
}): string {
  const parts: string[] = []
  
  if (address.houseNumber) {
    parts.push(`บ้านเลขที่ ${address.houseNumber}`)
  }
  
  if (address.village) {
    parts.push(`หมู่ ${address.village}`)
  }
  
  if (address.road) {
    parts.push(address.road)
  }
  
  if (address.subdistrict) {
    parts.push(`ตำบล${address.subdistrict}`)
  }
  
  if (address.district) {
    parts.push(`อำเภอ${address.district}`)
  }
  
  if (address.province) {
    parts.push(`จังหวัด${address.province}`)
  }
  
  if (address.postalCode) {
    parts.push(address.postalCode)
  }
  
  return parts.join(' ')
}

/**
 * Format Thai phone number
 */
export function formatThaiPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Handle different phone number formats
  if (cleaned.length === 10) {
    // Mobile: 0XX-XXX-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 9) {
    // Landline: 0X-XXX-XXXX
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  } else if (cleaned.length === 12 && cleaned.startsWith('66')) {
    // International format: +66 XX-XXX-XXXX
    return `+66 ${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phone // Return original if format not recognized
}

/**
 * Convert Arabic numerals to Thai numerals
 */
export function toThaiNumerals(input: string | number): string {
  const thaiNumerals = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
  return input.toString().replace(/[0-9]/g, (digit) => thaiNumerals[parseInt(digit)])
}

/**
 * Convert Christian Era year to Buddhist Era
 */
export function toBuddhistEra(year: number): number {
  return year + 543
}

/**
 * Convert Buddhist Era year to Christian Era
 */
export function toChristianEra(buddhistYear: number): number {
  return buddhistYear - 543
}

/**
 * Get Thai day of week color (traditional belief system)
 */
export function getThaiDayColor(date: Date): { color: string; thai: string; meaning: string } {
  const dayColors = [
    { color: '#FF0000', thai: 'แดง', meaning: 'อาทิตย์' }, // Sunday - Red
    { color: '#FFFF00', thai: 'เหลือง', meaning: 'จันทร์' }, // Monday - Yellow
    { color: '#FF69B4', thai: 'ชมพู', meaning: 'อังคาร' }, // Tuesday - Pink
    { color: '#00FF00', thai: 'เขียว', meaning: 'พุธ' }, // Wednesday - Green
    { color: '#FFA500', thai: 'ส้ม', meaning: 'พฤหัสบดี' }, // Thursday - Orange
    { color: '#87CEEB', thai: 'ฟ้า', meaning: 'ศุกร์' }, // Friday - Light Blue
    { color: '#800080', thai: 'ม่วง', meaning: 'เสาร์' }, // Saturday - Purple
  ]
  
  return dayColors[date.getDay()]
}

/**
 * Format number with Thai thousand separators
 */
export function formatThaiNumber(num: number): string {
  return num.toLocaleString('th-TH')
}

/**
 * Get appropriate Thai greeting based on time of day
 */
export function getThaiGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return 'สวัสดีตอนเช้า' // Good morning
  } else if (hour >= 12 && hour < 18) {
    return 'สวัสดีตอนบ่าย' // Good afternoon
  } else {
    return 'สวัสดีตอนเย็น' // Good evening
  }
}

/**
 * Validate Thai ID card number
 */
export function validateThaiID(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id[i]) * (13 - i)
  }
  
  const remainder = sum % 11
  const checkDigit = remainder < 2 ? remainder : 11 - remainder
  
  return checkDigit === parseInt(id[12])
}

/**
 * Generate PromptPay QR code data
 */
export function generatePromptPayQR(phoneOrId: string, amount?: number): string {
  // This is a simplified version - in production you'd use a proper QR library
  const payload = {
    version: '01',
    type: 'promptpay',
    recipient: phoneOrId,
    amount: amount || 0
  }
  
  return JSON.stringify(payload)
}