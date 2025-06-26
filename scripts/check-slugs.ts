import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSlugs() {
  console.log('📦 Product slugs:')
  const products = await prisma.product.findMany({
    select: { name: true, slug: true },
    take: 10
  })
  
  products.forEach(p => {
    console.log(`  "${p.name}" → ${p.slug}`)
  })

  console.log('\n📍 Shop slugs:')
  const shops = await prisma.shop.findMany({
    select: { name: true, slug: true }
  })
  
  shops.forEach(s => {
    console.log(`  "${s.name}" → ${s.slug}`)
  })

  await prisma.$disconnect()
}

checkSlugs()