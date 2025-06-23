import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { imageUpload } from '@/lib/image-upload'
import { initializeBucket } from '@/lib/minio'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}