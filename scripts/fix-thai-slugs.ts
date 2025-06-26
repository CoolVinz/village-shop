import { PrismaClient } from '@prisma/client'
import { generateProductSlug, generateUniqueSlug } from '../src/lib/slug'

const prisma = new PrismaClient()

async function fixThaiSlugs() {
  console.log('🔄 Fixing Thai product slugs...')

  // Find products with empty or invalid slugs
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' },
        { slug: { startsWith: '-' } }
      ]
    },
    select: { id: true, name: true, category: true, slug: true }
  })

  console.log(`Found ${products.length} products with invalid slugs`)

  // Get all existing valid slugs
  const existingProductSlugs = await prisma.product.findMany({
    where: { 
      slug: { not: null },
      NOT: {
        OR: [
          { slug: '' },
          { slug: { startsWith: '-' } }
        ]
      }
    },
    select: { slug: true }
  }).then(products => products.map(p => p.slug!))

  for (const product of products) {
    console.log(`Fixing: "${product.name}" (current: "${product.slug}")`)
    
    // Generate new slug
    const baseSlug = generateProductSlug(product.name, product.category || undefined)
    const uniqueSlug = generateUniqueSlug(baseSlug, existingProductSlugs)
    
    await prisma.product.update({
      where: { id: product.id },
      data: { slug: uniqueSlug }
    })
    
    existingProductSlugs.push(uniqueSlug)
    console.log(`✅ "${product.name}" → ${uniqueSlug}`)
  }

  await prisma.$disconnect()
  console.log('🎉 Thai slug fixing completed!')
}

fixThaiSlugs()