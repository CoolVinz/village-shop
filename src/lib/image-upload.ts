import sharp from 'sharp'
import { uploadFile, generateFileName, BUCKET_FOLDERS } from './minio'

export interface ImageUploadOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ImageUploadResult {
  url: string
  fileName: string
  size: number
}

// Default image processing options
const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 85,
  format: 'webp',
}

// Process and upload image
export async function processAndUploadImage(
  file: Buffer,
  originalName: string,
  folder: keyof typeof BUCKET_FOLDERS,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    // Process image with Sharp
    let sharpInstance = sharp(file)
    
    // Resize if dimensions are specified
    if (config.maxWidth || config.maxHeight) {
      sharpInstance = sharpInstance.resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
    
    // Convert format and set quality
    if (config.format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality: config.quality })
    } else if (config.format === 'png') {
      sharpInstance = sharpInstance.png({ quality: config.quality })
    } else if (config.format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: config.quality })
    }
    
    // Process the image
    const processedBuffer = await sharpInstance.toBuffer()
    
    // Generate filename with proper extension
    const extension = config.format || 'webp'
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const fileName = generateFileName(`${nameWithoutExt}.${extension}`, BUCKET_FOLDERS[folder])
    
    // Upload to MinIO
    const contentType = `image/${extension}`
    const url = await uploadFile(processedBuffer, fileName, contentType)
    
    return {
      url,
      fileName,
      size: processedBuffer.length,
    }
  } catch (error) {
    console.error('❌ Error processing and uploading image:', error)
    throw new Error('Failed to process and upload image')
  }
}

// Upload multiple images
export async function uploadMultipleImages(
  files: { buffer: Buffer; originalName: string }[],
  folder: keyof typeof BUCKET_FOLDERS,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult[]> {
  const uploadPromises = files.map(file =>
    processAndUploadImage(file.buffer, file.originalName, folder, options)
  )
  
  return Promise.all(uploadPromises)
}

// Specific upload functions for different use cases
export const imageUpload = {
  // Product images - high quality for catalog
  product: (file: Buffer, originalName: string) =>
    processAndUploadImage(file, originalName, 'PRODUCTS', {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 90,
      format: 'webp',
    }),
  
  // Shop logos - smaller, optimized
  shopLogo: (file: Buffer, originalName: string) =>
    processAndUploadImage(file, originalName, 'SHOP_LOGOS', {
      maxWidth: 400,
      maxHeight: 400,
      quality: 90,
      format: 'webp',
    }),
  
  // Payment slips - maintain quality for verification
  paymentSlip: (file: Buffer, originalName: string) =>
    processAndUploadImage(file, originalName, 'PAYMENT_SLIPS', {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 95,
      format: 'jpeg',
    }),
  
  // User avatars - small, circular
  userAvatar: (file: Buffer, originalName: string) =>
    processAndUploadImage(file, originalName, 'USERS', {
      maxWidth: 200,
      maxHeight: 200,
      quality: 85,
      format: 'webp',
    }),
}