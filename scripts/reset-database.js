const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// MinIO cleanup functionality
async function cleanupMinIOFiles() {
  try {
    // Import MinIO client (optional - only if environment is configured)
    const { getMinioClient, BUCKET_NAME, BUCKET_FOLDERS } = require('../src/lib/minio.ts')
    
    console.log('🗂️  Cleaning up MinIO files...')
    const minioClient = getMinioClient()
    
    // List and delete files in each folder
    const folders = Object.values(BUCKET_FOLDERS)
    let totalDeleted = 0
    
    for (const folder of folders) {
      try {
        const objectsList = []
        const objectsStream = minioClient.listObjectsV2(BUCKET_NAME, folder, true)
        
        for await (const obj of objectsStream) {
          objectsList.push(obj.name)
        }
        
        if (objectsList.length > 0) {
          await minioClient.removeObjects(BUCKET_NAME, objectsList)
          totalDeleted += objectsList.length
          console.log(`  ✅ Deleted ${objectsList.length} files from ${folder}/`)
        } else {
          console.log(`  📁 No files found in ${folder}/`)
        }
        
      } catch (folderError) {
        console.log(`  ⚠️  Could not clean folder ${folder}/: ${folderError.message}`)
      }
    }
    
    console.log(`🗑️  Total files deleted from MinIO: ${totalDeleted}`)
    
  } catch (error) {
    console.log('⚠️  MinIO cleanup skipped (not configured or not available):', error.message)
  }
}

async function main() {
  console.log('🔄 Starting database reset...')
  console.log('⚠️  This will DELETE all data except admin users!')
  
  // Optional: Add confirmation prompt
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const skipConfirmation = args.includes('--yes')
  const cleanupFiles = args.includes('--cleanup-files')
  
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No data will be deleted')
  }
  
  if (!skipConfirmation && !dryRun) {
    console.log('❌ This operation will permanently delete data!')
    console.log('💡 Add --yes flag to confirm or --dry-run to test')
    process.exit(1)
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Get admin users to preserve
      const adminUsers = await tx.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, username: true }
      })
      
      console.log(`👑 Found ${adminUsers.length} admin users to preserve:`)
      adminUsers.forEach(admin => {
        console.log(`  - ${admin.name} (${admin.username || admin.id})`)
      })

      if (dryRun) {
        // Show what would be deleted
        const userCount = await tx.user.count({ where: { role: { not: 'ADMIN' } } })
        const shopCount = await tx.shop.count()
        const productCount = await tx.product.count()
        const orderCount = await tx.order.count()
        const orderItemCount = await tx.orderItem.count()
        const paymentSlipCount = await tx.paymentSlip.count()
        
        console.log('📊 Data that would be deleted:')
        console.log(`  - ${userCount} non-admin users`)
        console.log(`  - ${shopCount} shops`)
        console.log(`  - ${productCount} products`)
        console.log(`  - ${orderCount} orders`)
        console.log(`  - ${orderItemCount} order items`)
        console.log(`  - ${paymentSlipCount} payment slips`)
        return
      }

      // Step 2: Safe deletion order (preserving referential integrity)
      console.log('🧹 Deleting data in safe order...')
      
      // Delete payment slips first (references orders)
      const deletedPaymentSlips = await tx.paymentSlip.deleteMany()
      console.log(`  ✅ Deleted ${deletedPaymentSlips.count} payment slips`)
      
      // Delete order items (references orders, products, shops)
      const deletedOrderItems = await tx.orderItem.deleteMany()
      console.log(`  ✅ Deleted ${deletedOrderItems.count} order items`)
      
      // Delete orders (references users as customers)
      const deletedOrders = await tx.order.deleteMany()
      console.log(`  ✅ Deleted ${deletedOrders.count} orders`)
      
      // Delete products (references shops)
      const deletedProducts = await tx.product.deleteMany()
      console.log(`  ✅ Deleted ${deletedProducts.count} products`)
      
      // Delete shops (references users as owners)
      const deletedShops = await tx.shop.deleteMany()
      console.log(`  ✅ Deleted ${deletedShops.count} shops`)
      
      // Delete NextAuth accounts and sessions for non-admin users
      const nonAdminUserIds = await tx.user.findMany({
        where: { role: { not: 'ADMIN' } },
        select: { id: true }
      })
      
      if (nonAdminUserIds.length > 0) {
        const userIds = nonAdminUserIds.map(u => u.id)
        
        const deletedAccounts = await tx.account.deleteMany({
          where: { userId: { in: userIds } }
        })
        console.log(`  ✅ Deleted ${deletedAccounts.count} NextAuth accounts`)
        
        const deletedSessions = await tx.session.deleteMany({
          where: { userId: { in: userIds } }
        })
        console.log(`  ✅ Deleted ${deletedSessions.count} NextAuth sessions`)
      }
      
      // Delete non-admin users (preserve admin users)
      const deletedUsers = await tx.user.deleteMany({
        where: {
          role: { not: 'ADMIN' }
        }
      })
      console.log(`  ✅ Deleted ${deletedUsers.count} non-admin users`)
      
      // Optional: Reset product categories (independent table)
      const resetCategories = args.includes('--reset-categories')
      if (resetCategories) {
        const deletedCategories = await tx.productCategory.deleteMany()
        console.log(`  ✅ Deleted ${deletedCategories.count} product categories`)
      }
      
      console.log('🎉 Database reset completed successfully!')
      console.log(`👑 Preserved ${adminUsers.length} admin users`)
      
      // Verify admin users still exist
      const remainingAdmins = await tx.user.count({ where: { role: 'ADMIN' } })
      console.log(`✅ Verification: ${remainingAdmins} admin users remain`)
      
      if (remainingAdmins !== adminUsers.length) {
        throw new Error('❌ Admin user count mismatch - rollback transaction!')
      }
    })
    
    // Optional: Cleanup MinIO files
    if (cleanupFiles && !dryRun) {
      await cleanupMinIOFiles()
    } else if (cleanupFiles && dryRun) {
      console.log('🗂️  File cleanup would be performed (--cleanup-files flag detected)')
    }
    
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    console.error('🔄 Transaction rolled back - no data was modified')
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Reset script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })