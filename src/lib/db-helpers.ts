import { prisma } from './prisma'
import { extractIdFromSlug } from './slug'

/**
 * Find product by slug or ID (for backward compatibility)
 */
export async function findProductBySlugOrId(slugOrId: string) {
  // First try to find by slug
  const productBySlug = await prisma.product.findUnique({
    where: { slug: slugOrId }
  })
  
  if (productBySlug) {
    return productBySlug
  }
  
  // Fallback: try to find by ID (for backward compatibility)
  // Check if it looks like a CUID
  if (slugOrId.length >= 20 && slugOrId.startsWith('c')) {
    return await prisma.product.findUnique({
      where: { id: slugOrId }
    })
  }
  
  // Try extracting ID from slug format
  const extractedId = extractIdFromSlug(slugOrId)
  if (extractedId) {
    return await prisma.product.findUnique({
      where: { id: extractedId }
    })
  }
  
  return null
}

/**
 * Find shop by slug or ID (for backward compatibility)
 */
export async function findShopBySlugOrId(slugOrId: string) {
  // First try to find by slug
  const shopBySlug = await prisma.shop.findUnique({
    where: { slug: slugOrId }
  })
  
  if (shopBySlug) {
    return shopBySlug
  }
  
  // Fallback: try to find by ID (for backward compatibility)
  // Check if it looks like a CUID
  if (slugOrId.length >= 20 && slugOrId.startsWith('c')) {
    return await prisma.shop.findUnique({
      where: { id: slugOrId }
    })
  }
  
  // Try extracting ID from slug format
  const extractedId = extractIdFromSlug(slugOrId)
  if (extractedId) {
    return await prisma.shop.findUnique({
      where: { id: extractedId }
    })
  }
  
  return null
}

/**
 * Get product URL (slug-based with ID fallback)
 */
export function getProductUrl(product: { slug: string | null; id: string }): string {
  return `/products/${product.slug || product.id}`
}

/**
 * Get shop URL (slug-based with ID fallback)
 */
export function getShopUrl(shop: { slug: string | null; id: string }): string {
  return `/shops/${shop.slug || shop.id}`
}

/**
 * Get vendor product URL (slug-based with ID fallback)
 */
export function getVendorProductUrl(product: { slug: string | null; id: string }, action?: 'edit'): string {
  const baseUrl = `/vendor/products/${product.slug || product.id}`
  return action ? `${baseUrl}/${action}` : baseUrl
}

/**
 * Get vendor shop URL (slug-based with ID fallback)
 */
export function getVendorShopUrl(shop: { slug: string | null; id: string }, action?: 'edit'): string {
  const baseUrl = `/vendor/shop/${shop.slug || shop.id}`
  return action ? `${baseUrl}/${action}` : baseUrl
}