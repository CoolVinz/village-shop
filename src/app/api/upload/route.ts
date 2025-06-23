import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // TEMPORARILY DISABLED AUTHENTICATION FOR DEVELOPMENT
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Check if MinIO is configured
    const requiredVars = ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']
    const missingVars = requiredVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('MinIO not configured. Missing environment variables:', missingVars)
      return NextResponse.json(
        { error: 'File storage not configured' },
        { status: 503 }
      )
    }

    // Lazy load MinIO-dependent modules only when needed
    const { imageUpload } = await import('@/lib/image-upload')
    const { initializeBucket } = await import('@/lib/minio')

    // Initialize MinIO bucket if needed
    await initializeBucket()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let result
    
    // Upload based on type
    switch (type) {
      case 'product':
        result = await imageUpload.product(buffer, file.name)
        break
      case 'shop-logo':
        result = await imageUpload.shopLogo(buffer, file.name)
        break
      case 'payment-slip':
        result = await imageUpload.paymentSlip(buffer, file.name)
        break
      case 'user-avatar':
        result = await imageUpload.userAvatar(buffer, file.name)
        break
      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    return NextResponse.json({
      url: result.url,
      fileName: result.fileName,
      size: result.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    // Handle MinIO configuration errors specifically
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return NextResponse.json(
        { error: 'File storage not configured properly' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}