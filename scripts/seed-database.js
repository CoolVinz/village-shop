const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...')
  await prisma.paymentSlip.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.shop.deleteMany()
  await prisma.user.deleteMany()

  // Create Admin User
  console.log('👑 Creating admin user...')
  const bcrypt = require('bcryptjs')
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.create({
    data: {
      id: 'admin-user-1',
      name: 'System Administrator',
      username: 'admin',
      password: adminPassword,
      houseNumber: '001',
      lineId: 'admin-line',
      phone: '+66-999-999-999',
      address: 'Village Office, Main Street',
      role: 'ADMIN',
      isActive: true,
      profileComplete: true
    }
  })

  // Create Vendors
  console.log('🏪 Creating vendor users...')
  const vendors = await Promise.all([
    prisma.user.create({
      data: {
        id: 'vendor-1',
        name: 'Somchai Jaidee',
        houseNumber: '123',
        lineId: 'somchai123',
        phone: '+66-81-234-5678',
        address: '123 Village Road, District A',
        role: 'VENDOR',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        id: 'vendor-2', 
        name: 'Malee Kaewjai',
        houseNumber: '456',
        lineId: 'malee456',
        phone: '+66-82-345-6789',
        address: '456 Market Street, District B',
        role: 'VENDOR',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        id: 'vendor-3',
        name: 'Niran Thongchai',
        houseNumber: '789',
        lineId: 'niran789',
        phone: '+66-83-456-7890',
        address: '789 Craft Lane, District C',
        role: 'VENDOR',
        isActive: true
      }
    }),
    // Keep existing dev user
    prisma.user.create({
      data: {
        id: 'dev-user-1',
        name: 'Development User',
        houseNumber: '999',
        lineId: 'dev-line-id',
        phone: '+66-99-999-9999',
        address: '999 Dev Street',
        role: 'VENDOR',
        isActive: true
      }
    })
  ])

  // Create Customers
  console.log('👥 Creating customer users...')
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        id: 'customer-1',
        name: 'Siriporn Nakorn',
        houseNumber: '201',
        lineId: 'siriporn201',
        phone: '+66-84-567-8901',
        address: '201 Residential Ave',
        role: 'CUSTOMER',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        id: 'customer-2',
        name: 'Prasert Wongdee',
        houseNumber: '202',
        lineId: 'prasert202',
        phone: '+66-85-678-9012',
        address: '202 Family Street',
        role: 'CUSTOMER',
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        id: 'customer-3',
        name: 'Wanida Srichaiyo',
        houseNumber: '203',
        lineId: 'wanida203',
        phone: '+66-86-789-0123',
        address: '203 Community Road',
        role: 'CUSTOMER',
        isActive: true
      }
    })
  ])

  // Create Shops
  console.log('🏬 Creating shops...')
  const shops = await Promise.all([
    prisma.shop.create({
      data: {
        id: 'shop-1',
        name: 'Somchai\'s Grocery',
        description: 'Fresh vegetables, fruits, and daily essentials from local farmers',
        houseNumber: '123',
        ownerId: vendors[0].id,
        isActive: true
      }
    }),
    prisma.shop.create({
      data: {
        id: 'shop-2',
        name: 'Malee\'s Hardware Store',
        description: 'Tools, home improvement supplies, and repair equipment',
        houseNumber: '456',
        ownerId: vendors[1].id,
        isActive: true
      }
    }),
    prisma.shop.create({
      data: {
        id: 'shop-3',
        name: 'Niran\'s Handicrafts',
        description: 'Traditional Thai crafts, decorations, and handmade items',
        houseNumber: '789',
        ownerId: vendors[2].id,
        isActive: true
      }
    })
  ])

  // Create Products
  console.log('📦 Creating products...')
  const products = await Promise.all([
    // Somchai's Grocery Products
    prisma.product.create({
      data: {
        name: 'Fresh Bananas',
        description: 'Sweet ripe bananas from local orchards, perfect for snacking',
        price: 25.00,
        stock: 50,
        category: 'Fruits',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Organic Rice',
        description: 'Premium jasmine rice, grown without chemicals, 5kg bag',
        price: 180.00,
        stock: 25,
        category: 'Grains',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Fresh Eggs',
        description: 'Free-range chicken eggs from village farms, 12 pieces',
        price: 45.00,
        stock: 30,
        category: 'Dairy & Eggs',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Green Vegetables Mix',
        description: 'Fresh pak choi, morning glory, and herbs bundle',
        price: 35.00,
        stock: 20,
        category: 'Vegetables',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[0].id
      }
    }),
    
    // Malee's Hardware Products
    prisma.product.create({
      data: {
        name: 'Hammer Set',
        description: 'Professional hammer set with different sizes for home repairs',
        price: 350.00,
        stock: 15,
        category: 'Tools',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Garden Hose 20m',
        description: 'Durable garden hose for watering plants and cleaning',
        price: 280.00,
        stock: 12,
        category: 'Garden',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'LED Light Bulbs Pack',
        description: 'Energy efficient LED bulbs, 9W, pack of 4',
        price: 120.00,
        stock: 40,
        category: 'Electrical',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[1].id
      }
    }),
    
    // Niran's Handicrafts Products
    prisma.product.create({
      data: {
        name: 'Bamboo Basket',
        description: 'Handwoven bamboo basket for storage and decoration',
        price: 150.00,
        stock: 8,
        category: 'Handicrafts',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Thai Silk Scarf',
        description: 'Beautiful traditional Thai silk scarf with authentic patterns',
        price: 450.00,
        stock: 5,
        category: 'Textiles',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Wooden Elephant Carving',
        description: 'Hand-carved wooden elephant, traditional Thai craftsmanship',
        price: 280.00,
        stock: 3,
        category: 'Decorations',
        imageUrls: [],
        isAvailable: true,
        shopId: shops[2].id
      }
    })
  ])

  // Create Orders
  console.log('📋 Creating orders...')
  const orders = await Promise.all([
    // Order 1 - Delivered
    prisma.order.create({
      data: {
        id: 'order-1',
        customerId: customers[0].id,
        customerHouseNumber: customers[0].houseNumber,
        totalAmount: 250.00,
        status: 'DELIVERED',
        notes: 'Please deliver to front door',
        deliveryTime: new Date('2024-06-20T10:00:00Z')
      }
    }),
    // Order 2 - In Progress
    prisma.order.create({
      data: {
        id: 'order-2',
        customerId: customers[1].id,
        customerHouseNumber: customers[1].houseNumber,
        totalAmount: 470.00,
        status: 'PREPARING',
        notes: 'Call before delivery',
        deliveryTime: new Date('2024-06-24T14:00:00Z')
      }
    }),
    // Order 3 - Pending
    prisma.order.create({
      data: {
        id: 'order-3',
        customerId: customers[2].id,
        customerHouseNumber: customers[2].houseNumber,
        totalAmount: 320.00,
        status: 'PENDING',
        notes: 'Weekend delivery preferred'
      }
    })
  ])

  // Create Order Items
  console.log('🛒 Creating order items...')
  await Promise.all([
    // Order 1 items
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        productId: products[0].id, // Bananas
        shopId: shops[0].id,
        quantity: 3,
        price: 25.00,
        status: 'DELIVERED'
      }
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        productId: products[1].id, // Rice
        shopId: shops[0].id,
        quantity: 1,
        price: 180.00,
        status: 'DELIVERED'
      }
    }),
    
    // Order 2 items
    prisma.orderItem.create({
      data: {
        orderId: orders[1].id,
        productId: products[4].id, // Hammer
        shopId: shops[1].id,
        quantity: 1,
        price: 350.00,
        status: 'PREPARING'
      }
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[1].id,
        productId: products[6].id, // LED Bulbs
        shopId: shops[1].id,
        quantity: 1,
        price: 120.00,
        status: 'PREPARING'
      }
    }),
    
    // Order 3 items
    prisma.orderItem.create({
      data: {
        orderId: orders[2].id,
        productId: products[7].id, // Bamboo Basket
        shopId: shops[2].id,
        quantity: 1,
        price: 150.00,
        status: 'PENDING'
      }
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[2].id,
        productId: products[9].id, // Wooden Elephant
        shopId: shops[2].id,
        quantity: 1,
        price: 280.00,
        status: 'PENDING'
      }
    })
  ])

  // Create Payment Slips
  console.log('💰 Creating payment slips...')
  await Promise.all([
    prisma.paymentSlip.create({
      data: {
        orderId: orders[0].id,
        imageUrl: 'https://example.com/payment-slip-1.jpg',
        status: 'VERIFIED',
        notes: 'Bank transfer confirmed'
      }
    }),
    prisma.paymentSlip.create({
      data: {
        orderId: orders[1].id,
        imageUrl: 'https://example.com/payment-slip-2.jpg',
        status: 'PENDING',
        notes: 'PromptPay transfer'
      }
    })
  ])

  // Create Product Categories
  console.log('🏷️ Creating product categories...')
  await Promise.all([
    prisma.productCategory.create({
      data: {
        name: 'Fruits',
        description: 'Fresh seasonal fruits',
        isActive: true
      }
    }),
    prisma.productCategory.create({
      data: {
        name: 'Vegetables',
        description: 'Fresh vegetables and herbs',
        isActive: true
      }
    }),
    prisma.productCategory.create({
      data: {
        name: 'Tools',
        description: 'Hardware and repair tools',
        isActive: true
      }
    }),
    prisma.productCategory.create({
      data: {
        name: 'Handicrafts',
        description: 'Traditional and handmade items',
        isActive: true
      }
    })
  ])

  console.log('✅ Database seeding completed successfully!')
  console.log('📊 Data Summary:')
  console.log(`  - 1 Admin user`)
  console.log(`  - 4 Vendor users (including dev-user-1)`)
  console.log(`  - 3 Customer users`)
  console.log(`  - 3 Shops`)
  console.log(`  - 10 Products`)
  console.log(`  - 3 Orders`)
  console.log(`  - 6 Order Items`)
  console.log(`  - 2 Payment Slips`)
  console.log(`  - 4 Product Categories`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })