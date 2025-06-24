const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('📊 Checking database contents...')

  const [
    userCount,
    shopCount,
    productCount,
    orderCount,
    paymentSlipCount,
    categoryCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.paymentSlip.count(),
    prisma.productCategory.count()
  ])

  console.log('\n📈 Current Database Stats:')
  console.log(`  👥 Users: ${userCount}`)
  console.log(`  🏪 Shops: ${shopCount}`)
  console.log(`  📦 Products: ${productCount}`)
  console.log(`  📋 Orders: ${orderCount}`)
  console.log(`  💰 Payment Slips: ${paymentSlipCount}`)
  console.log(`  🏷️ Categories: ${categoryCount}`)

  if (userCount > 0) {
    console.log('\n👤 Sample Users:')
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        name: true,
        role: true,
        houseNumber: true
      }
    })
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) - House #${user.houseNumber}`)
    })
  }

  if (shopCount > 0) {
    console.log('\n🏬 Sample Shops:')
    const shops = await prisma.shop.findMany({
      take: 3,
      include: {
        owner: {
          select: { name: true }
        },
        products: {
          select: { id: true }
        }
      }
    })
    shops.forEach(shop => {
      console.log(`  - ${shop.name} by ${shop.owner.name} (${shop.products.length} products)`)
    })
  }

  if (productCount > 0) {
    console.log('\n📦 Sample Products:')
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        shop: {
          select: { name: true }
        }
      }
    })
    products.forEach(product => {
      console.log(`  - ${product.name} - ฿${product.price} (${product.stock} in stock) @ ${product.shop.name}`)
    })
  }

  console.log('\n✅ Database check complete!')
}

main()
  .catch((e) => {
    console.error('❌ Database check failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })