import { Client } from 'minio'

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'villager-shop'

// Lazy-load MinIO client to avoid build-time environment variable issues
let minioClientInstance: Client | null = null

export function getMinioClient(): Client {
  if (!minioClientInstance) {
    // Validate required environment variables
    const requiredVars = {
      MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
      MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
      MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    }

    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`)
      }
    }

    minioClientInstance = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: parseInt(process.env.MINIO_PORT || '443'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    })
  }

  return minioClientInstance
}

// Bucket organization for multi-vendor marketplace
export const BUCKET_FOLDERS = {
  SHOP_LOGOS: 'shops/logos',
  PRODUCTS: 'products',
  PAYMENT_SLIPS: 'payment-slips',
  USERS: 'users',
} as const

// Initialize bucket and ensure it exists with proper permissions
export async function initializeBucket() {
  try {
    const minioClient = getMinioClient()
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
    
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`✅ Created bucket: ${BUCKET_NAME}`)
    } else {
      console.log(`✅ Bucket ${BUCKET_NAME} already exists`)
    }

    // Set bucket policy to allow public read access
    await setBucketPublicReadPolicy()
    
  } catch (error) {
    console.error('❌ Error initializing MinIO bucket:', error)
    throw error
  }
}

// Set bucket policy to allow public read access for all objects
export async function setBucketPublicReadPolicy() {
  try {
    const minioClient = getMinioClient()
    
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    }

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(publicReadPolicy))
    console.log(`✅ Set public read policy for bucket: ${BUCKET_NAME}`)
  } catch (error) {
    console.error('❌ Error setting bucket policy:', error)
    throw error
  }
}

// Generate a unique filename with timestamp
export function generateFileName(originalName: string, folder: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  return `${folder}/${timestamp}-${randomString}.${extension}`
}

// Upload file to MinIO
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  try {
    const minioClient = getMinioClient()
    await minioClient.putObject(BUCKET_NAME, fileName, file, file.length, {
      'Content-Type': contentType,
    })
    
    // Return the public URL
    return `https://${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`
  } catch (error) {
    console.error('❌ Error uploading file to MinIO:', error)
    throw error
  }
}

// Delete file from MinIO
export async function deleteFile(fileName: string): Promise<void> {
  try {
    const minioClient = getMinioClient()
    await minioClient.removeObject(BUCKET_NAME, fileName)
    console.log(`✅ Deleted file: ${fileName}`)
  } catch (error) {
    console.error('❌ Error deleting file from MinIO:', error)
    throw error
  }
}

// Get presigned URL for temporary access
export async function getPresignedUrl(
  fileName: string,
  expiry: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  try {
    const minioClient = getMinioClient()
    return await minioClient.presignedGetObject(BUCKET_NAME, fileName, expiry)
  } catch (error) {
    console.error('❌ Error generating presigned URL:', error)
    throw error
  }
}