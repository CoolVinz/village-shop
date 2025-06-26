/**
 * Script to generate slugs for existing products and shops
 * Run with: npx tsx scripts/generate-slugs.ts
 */

import { PrismaClient } from '@prisma/client'
import { generateProductSlug, generateShopSlug, generateUniqueSlug } from '../src/lib/slug'

const prisma = new PrismaClient()

async function generateSlugs() {
  console.log('🔄 Starting slug generation...')

  try {
    // Generate slugs for shops
    console.log('📍 Generating shop slugs...')
    const shops = await prisma.shop.findMany({
      where: { slug: null },
      select: { id: true, name: true, houseNumber: true }
    })

    const existingShopSlugs = await prisma.shop.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    }).then(shops => shops.map(s => s.slug!))

    for (const shop of shops) {
      const baseSlug = generateShopSlug(shop.name, shop.houseNumber)
      const uniqueSlug = generateUniqueSlug(baseSlug, existingShopSlugs)
      
      await prisma.shop.update({
        where: { id: shop.id },
        data: { slug: uniqueSlug }
      })
      
      existingShopSlugs.push(uniqueSlug)
      console.log(`✅ Shop "${shop.name}" → ${uniqueSlug}`)
    }

    // Generate slugs for products
    console.log('📦 Generating product slugs...')
    const products = await prisma.product.findMany({
      where: { slug: null },
      select: { id: true, name: true, category: true }
    })

    const existingProductSlugs = await prisma.product.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    }).then(products => products.map(p => p.slug!))

    for (const product of products) {
      const baseSlug = generateProductSlug(product.name, product.category || undefined)
      const uniqueSlug = generateUniqueSlug(baseSlug, existingProductSlugs)
      
      await prisma.product.update({
        where: { id: product.id },
        data: { slug: uniqueSlug }
      })
      
      existingProductSlugs.push(uniqueSlug)
      console.log(`✅ Product "${product.name}" → ${uniqueSlug}`)
    }

    console.log('🎉 Slug generation completed successfully!')
    
  } catch (error) {
    console.error('❌ Error generating slugs:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

generateSlugs()