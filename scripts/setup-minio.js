#!/usr/bin/env node

const { Client } = require('minio')

async function setupMinIO() {
  try {
    console.log('🔧 Setting up MinIO bucket permissions...')
    
    const minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })

    const bucketName = process.env.MINIO_BUCKET_NAME || 'villager-shop'
    
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName)
    if (!bucketExists) {
      console.log(`📦 Creating bucket: ${bucketName}`)
      await minioClient.makeBucket(bucketName)
    }

    // Set public read policy
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    }

    await minioClient.setBucketPolicy(bucketName, JSON.stringify(publicReadPolicy))
    console.log(`✅ Set public read policy for bucket: ${bucketName}`)
    
    // Test access
    console.log(`🧪 Testing bucket access...`)
    const objects = await minioClient.listObjects(bucketName, '', false)
    let objectCount = 0
    
    for await (const obj of objects) {
      objectCount++
      if (objectCount <= 3) {
        console.log(`📁 Found object: ${obj.name}`)
      }
    }
    
    console.log(`📊 Total objects in bucket: ${objectCount}`)
    console.log(`🌐 Images should now be accessible at: https://${process.env.MINIO_ENDPOINT}/${bucketName}/...`)
    
  } catch (error) {
    console.error('❌ Error setting up MinIO:', error)
    process.exit(1)
  }
}

setupMinIO()