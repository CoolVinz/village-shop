const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUser() {
  try {
    console.log('🔍 Testing user existence...')
    
    const user = await prisma.user.findUnique({
      where: { id: 'dev-user-1' }
    })

    if (user) {
      console.log('✅ Dev user found:', user)
    } else {
      console.log('❌ Dev user not found!')
    }

    // Also test if we can create a simple shop
    console.log('🔍 Testing shop creation...')
    
    const testShop = {
      name: 'Test Shop ' + Date.now(),
      description: 'A test shop',
      houseNumber: '123',
      isActive: true,
      ownerId: 'dev-user-1'
    }

    const shop = await prisma.shop.create({
      data: testShop
    })

    console.log('✅ Test shop created:', shop)

    // Clean up
    await prisma.shop.delete({
      where: { id: shop.id }
    })
    console.log('🧹 Test shop cleaned up')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUser()