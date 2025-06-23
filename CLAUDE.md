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

This is a Next.js 15 project with TypeScript using the App Router architecture. The project uses:

- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
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

Current connection: `postgres://postgres:F2pMZ2HO1IASnnMCuMqjEoFjGC75R1wcpaUf5OIIX174C4Xev6BhArClvuJJ12kH@82.180.137.92:5437/postgres`

## Database Schema

The project includes example models in `prisma/schema.prisma`:
- **User**: Basic user management with email and orders
- **Product**: E-commerce products with pricing and inventory
- **Order**: Order management with status tracking
- **OrderItem**: Individual items within orders

## Database Operations

Always run `npm run db:generate` after modifying `prisma/schema.prisma` to update TypeScript types.

Example usage:
```typescript
import { prisma } from '@/lib/prisma'

// Create a user
const user = await prisma.user.create({
  data: { email: 'user@example.com', name: 'John Doe' }
})

// Find products with relations
const products = await prisma.product.findMany({
  include: { orderItems: true }
})
```

## Component Development

When adding new components:
1. Use existing shadcn/ui components as building blocks
2. Follow the established pattern in `src/components/ui/`
3. Use the `cn()` utility for conditional class merging
4. Leverage Tailwind CSS with the configured design tokens