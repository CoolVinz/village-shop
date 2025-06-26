# MinIO Bucket Migration Guide

## Issue
The original bucket name `villager-shop` contained a hyphen which can cause URL parsing issues and DNS resolution problems with MinIO/S3 services.

## Solution
Changed bucket name from `villager-shop` to `villagershop` (removed hyphen).

## Migration Steps

### If you have existing data in the old bucket:

1. **Create new bucket:**
   ```bash
   # Using MinIO Client (mc)
   mc mb minio/villagershop
   ```

2. **Copy existing data:**
   ```bash
   # Copy all objects from old bucket to new bucket
   mc cp --recursive minio/villager-shop/ minio/villagershop/
   ```

3. **Verify data copied:**
   ```bash
   # List contents of new bucket
   mc ls --recursive minio/villagershop/
   ```

4. **Update database URLs (if needed):**
   ```sql
   -- Update any hardcoded URLs in the database
   UPDATE products SET 
   "imageUrls" = array_replace("imageUrls", 
     'https://minio-shop.aivinz.xyz/villager-shop/', 
     'https://minio-shop.aivinz.xyz/villagershop/'
   );
   ```

5. **Delete old bucket (optional):**
   ```bash
   # After confirming everything works
   mc rm --recursive --force minio/villager-shop/
   mc rb minio/villager-shop
   ```

## New URLs
- **Old format:** `https://minio-shop.aivinz.xyz/villager-shop/products/image.jpg`
- **New format:** `https://minio-shop.aivinz.xyz/villagershop/products/image.jpg`

## Files Changed
- `.env` - Updated `MINIO_BUCKET_NAME`
- `src/lib/minio.ts` - Updated fallback bucket name