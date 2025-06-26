/**
 * Slug generation utilities for SEO-friendly URLs
 */

/**
 * Generate a URL-friendly slug from a string
 * Handles Thai characters by transliterating to English
 */
export function generateSlug(text: string): string {
  // Thai to English transliteration map
  const thaiToEng: { [key: string]: string } = {
    'แมว': 'cat',
    'ขนมจีน': 'khanom-chin',
    'หมาล่า': 'mala',
    'ก': 'g', 'ข': 'kh', 'ค': 'kh', 'ง': 'ng',
    'จ': 'j', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's',
    'ญ': 'y', 'ด': 'd', 'ต': 't', 'ถ': 'th',
    'ท': 'th', 'ธ': 'th', 'น': 'n', 'บ': 'b',
    'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph',
    'ฟ': 'f', 'ภ': 'ph', 'ม': 'm', 'ย': 'y',
    'ร': 'r', 'ล': 'l', 'ว': 'w', 'ส': 's',
    'ห': 'h', 'อ': 'o', 'ฮ': 'h',
    'า': 'a', 'ิ': 'i', 'ี': 'i', 'ึ': 'ue',
    'ื': 'ue', 'ุ': 'u', 'ู': 'u', 'เ': 'e',
    'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai',
    'ำ': 'am', '่': '', '้': '', '๊': '', '๋': '',
    '์': '', 'ั': 'a', 'ะ': 'a'
  }

  let transliterated = text
  
  // First try exact word matches
  for (const [thai, eng] of Object.entries(thaiToEng)) {
    if (thai.length > 1) {
      transliterated = transliterated.replace(new RegExp(thai, 'g'), eng)
    }
  }
  
  // Then character-by-character for remaining Thai characters
  for (const [thai, eng] of Object.entries(thaiToEng)) {
    if (thai.length === 1) {
      transliterated = transliterated.replace(new RegExp(thai, 'g'), eng)
    }
  }

  return transliterated
    .toLowerCase()
    .trim()
    // Replace special characters and spaces with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    // Ensure we have at least something if everything was removed
    || 'product'
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

/**
 * Generate a product slug from name and optional category
 */
export function generateProductSlug(name: string, category?: string): string {
  const nameSlug = generateSlug(name)
  
  if (category) {
    const categorySlug = generateSlug(category)
    return `${categorySlug}-${nameSlug}`
  }
  
  return nameSlug
}

/**
 * Generate a shop slug from name and house number
 */
export function generateShopSlug(name: string, houseNumber: string): string {
  const nameSlug = generateSlug(name)
  const houseSlug = generateSlug(houseNumber)
  return `${nameSlug}-house-${houseSlug}`
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

/**
 * Extract ID from slug if it contains one (fallback compatibility)
 * Format: "product-name-123" or just "product-name"
 */
export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  // Check if last part is a CUID-like string (starts with 'c' and has right length)
  if (lastPart.length >= 20 && lastPart.startsWith('c')) {
    return lastPart
  }
  
  return null
}