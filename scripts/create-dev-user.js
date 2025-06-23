const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDevUser() {
  try {
    // Check if dev user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: 'dev-user-1' }
    })

    if (existingUser) {
      console.log('✅ Dev user already exists:', existingUser)
      return existingUser
    }

    // Create dev user
    const devUser = await prisma.user.create({
      data: {
        id: 'dev-user-1',
        name: 'Development User',
        houseNumber: '123',
        role: 'VENDOR',
        lineId: 'dev-line-id',
        phone: '+66-123-456-789',
        address: '123 Village Street'
      }
    })

    console.log('✅ Created dev user:', devUser)
    return devUser
  } catch (error) {
    console.error('❌ Error creating dev user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createDevUser()
  .then(() => {
    console.log('🎉 Dev user setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed to create dev user:', error)
    process.exit(1)
  })