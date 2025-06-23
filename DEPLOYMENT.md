# Deployment Configuration for line-shop.aivinz.xyz

## Environment Variables Required

Add these environment variables to your Coolify deployment:

```bash
# Database
DATABASE_URL="YOUR_POSTGRES_CONNECTION_STRING"

# MinIO Configuration
MINIO_ENDPOINT="YOUR_MINIO_ENDPOINT"
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY="YOUR_MINIO_ACCESS_KEY"
MINIO_SECRET_KEY="YOUR_MINIO_SECRET_KEY"
MINIO_BUCKET_NAME="villager-shop"

# NextAuth Configuration (required even when disabled)
NEXTAUTH_URL="https://line-shop.aivinz.xyz"
NEXTAUTH_SECRET="YOUR_SECURE_RANDOM_STRING"

# LINE Login Configuration (leave empty for now)
LINE_CLIENT_ID=""
LINE_CLIENT_SECRET=""
```

## ⚠️ SECURITY NOTE
**NEVER commit actual credentials to version control!**
Replace the placeholder values above with your actual credentials only in your deployment environment.

## Deployment Steps

1. **Set Environment Variables** in Coolify dashboard
2. **Deploy** - build should now succeed
3. **Create Dev User** on first deployment:
   ```bash
   node scripts/create-dev-user.js
   ```

## Current Status

- ✅ Authentication disabled for development
- ✅ MinIO lazy loading implemented
- ✅ Database connection configured
- ✅ Build errors fixed
- ⚠️ NextAuth environment variables still required (but auth is disabled)

## Testing After Deployment

1. Visit: https://line-shop.aivinz.xyz
2. Navigate to: https://line-shop.aivinz.xyz/vendor
3. Create shops and products without authentication

## Re-enabling Authentication Later

When ready to enable LINE Login:
1. Uncomment authentication code in middleware
2. Uncomment API route authentication
3. Configure LINE_CLIENT_ID and LINE_CLIENT_SECRET
4. Update NextAuth configuration