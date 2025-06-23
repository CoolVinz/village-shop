# Development Mode Setup

⚠️ **AUTHENTICATION IS TEMPORARILY DISABLED FOR DEVELOPMENT**

## What's Been Disabled

1. **Middleware authentication** (`src/middleware.ts`) - Commented out to allow access to all routes
2. **API route authentication** - All API routes now use mock session data
3. **Vendor layout authentication** - Uses mock user data
4. **Navigation authentication** - Session checks disabled

## Mock User Data

All authenticated routes now use this mock user:
- **ID**: `dev-user-1`
- **Name**: Development User
- **Email**: dev@example.com
- **Role**: VENDOR
- **House Number**: 123

## Accessing Protected Routes

You can now directly access:
- `/vendor` - Vendor dashboard
- `/vendor/shop` - Shop management
- `/vendor/products` - Product management
- All API endpoints

## Re-enabling Authentication

When ready to re-enable authentication:

1. **Uncomment middleware** in `src/middleware.ts`
2. **Restore API authentication** in:
   - `src/app/api/shops/route.ts`
   - `src/app/api/products/route.ts`
   - `src/app/api/upload/route.ts`
3. **Restore vendor layout** in `src/app/vendor/layout.tsx`
4. **Restore navigation** in `src/components/ui/navigation.tsx`

## Database

The database is connected and all tables are created. You can:
- Create shops and products through the vendor dashboard
- View them on the customer-facing pages
- Test the full marketplace workflow

## Development URLs

- **Homepage**: http://localhost:3000
- **Products**: http://localhost:3000/products
- **Shops**: http://localhost:3000/shops
- **Vendor Dashboard**: http://localhost:3000/vendor