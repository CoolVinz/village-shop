# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio for database GUI

## Architecture Overview

This is a **Multi-Vendor Village Marketplace** built with Next.js 15 and TypeScript using the App Router architecture. The project uses:

- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS v3 with CSS variables for theming
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Authentication**: NextAuth.js with LINE Login integration (for Thai/Asian markets)
- **File Storage**: MinIO self-hosted S3-compatible storage for images
- **Image Processing**: Sharp for optimization and resizing
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React hooks and context (no external state management library)
- **Icons**: Lucide React icons
- **Notifications**: React Hot Toast and Sonner for toast notifications

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/
│   └── ui/          # Shadcn/ui components (40+ pre-built components)
├── hooks/           # Custom React hooks (mobile detection, etc.)
└── lib/             # Utilities and configurations
    ├── prisma.ts    # Prisma client singleton
    ├── auth.ts      # NextAuth configuration with LINE Login
    ├── minio.ts     # MinIO client and file operations
    ├── image-upload.ts # Image processing and upload utilities
    └── utils.ts     # Utility functions (cn for class merging)
```

## Key Design Patterns

- **Component Architecture**: Uses shadcn/ui component system with consistent styling via `cn()` utility
- **Database Integration**: Prisma ORM with auto-generated TypeScript types and migrations
- **Responsive Design**: Mobile-first approach with `useIsMobile` hook for breakpoint detection
- **Theming**: CSS variables system for consistent styling across components

## Environment Setup

Requires PostgreSQL environment variables:
- `DATABASE_URL` - PostgreSQL connection string for Prisma

Current connection: Set via `DATABASE_URL` environment variable

## Multi-Vendor Database Schema

The project implements a complete multi-vendor marketplace schema in `prisma/schema.prisma`:

### **Core Models:**
- **User**: Village residents with house numbers, LINE ID, and roles (CUSTOMER, VENDOR, ADMIN)
- **Shop**: Individual vendor shops with owner relationship
- **Product**: Products belonging to specific shops with multiple images
- **Order**: Customer orders with delivery time booking
- **OrderItem**: Items from multiple vendors in a single order
- **PaymentSlip**: Payment verification through uploaded receipts
- **ProductCategory**: Organization system for products

### **User Roles:**
- **CUSTOMER**: Village residents who shop
- **VENDOR**: Shop owners who sell products  
- **ADMIN**: Platform administrators

### **Key Features:**
- House number-based user identification for village delivery
- Multi-vendor cart and order splitting
- Image upload for products, shop logos, and payment slips
- Delivery time booking system
- Role-based access control

## MinIO Configuration

Self-hosted MinIO storage configuration:

### **Environment Variables:**
```env
MINIO_ENDPOINT="your-minio-endpoint"
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET_NAME="villager-shop"
```

### **Bucket Organization:**
- `shops/logos/` - Shop logo images
- `products/` - Product catalog images
- `payment-slips/` - Payment receipt uploads
- `users/` - User avatar images

### **Image Upload API:**
```typescript
// Upload endpoint: POST /api/upload
// Supports types: 'product', 'shop-logo', 'payment-slip', 'user-avatar'

const formData = new FormData()
formData.append('file', file)
formData.append('type', 'product')

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})
```

## Authentication System

Uses NextAuth.js with LINE Login for Thai/Asian market integration:

### **Configuration:**
- LINE Login OAuth provider (credentials to be configured)
- House number collection during registration
- Role-based access control
- Session management with JWT

### **Usage:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
// session.user includes: id, name, houseNumber, role, lineId
```

## Database Operations

Always run `npm run db:generate` after modifying `prisma/schema.prisma` to update TypeScript types.

### **Example Usage:**
```typescript
import { prisma } from '@/lib/prisma'

// Create a vendor user
const vendor = await prisma.user.create({
  data: { 
    name: 'Shop Owner',
    houseNumber: '123/4',
    role: 'VENDOR',
    lineId: 'U1234567890'
  }
})

// Create a shop
const shop = await prisma.shop.create({
  data: {
    name: 'Village Grocery',
    description: 'Fresh local products',
    ownerId: vendor.id,
    houseNumber: '123/4'
  }
})

// Multi-vendor order with delivery time
const order = await prisma.order.create({
  data: {
    customerId: customerId,
    customerHouseNumber: '456/7',
    deliveryTime: new Date('2024-01-15T14:00:00'),
    totalAmount: 150.00,
    orderItems: {
      create: [
        {
          productId: product1.id,
          shopId: shop1.id,
          quantity: 2,
          price: 50.00
        }
      ]
    }
  }
})
```

## Component Development

When adding new components:
1. Use existing shadcn/ui components as building blocks
2. Follow the established pattern in `src/components/ui/`
3. Use the `cn()` utility for conditional class merging
4. Leverage Tailwind CSS with the configured design tokens

## Commit Policy

**CRITICAL**: Always commit AND PUSH changes immediately after completing any coding task. 
1. **COMMIT** with descriptive emoji-based messages (🔧, 🛠️, ✨, etc.)
2. **PUSH** to remote repository immediately after commit
3. Never leave uncommitted or unpushed changes