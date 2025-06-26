import { NextResponse } from 'next/server'
import { setBucketPublicReadPolicy, BUCKET_NAME } from '@/lib/minio'

export async function POST() {
  try {
    console.log('🔧 Fixing bucket permissions for:', BUCKET_NAME)
    
    await setBucketPublicReadPolicy()
    
    return NextResponse.json({ 
      success: true, 
      message: `Bucket ${BUCKET_NAME} is now publicly readable`,
      bucket: BUCKET_NAME 
    })
  } catch (error) {
    console.error('❌ Error fixing bucket permissions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix bucket permissions', 
        details: error instanceof Error ? error.message : 'Unknown error',
        bucket: BUCKET_NAME 
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to fix bucket permissions',
    bucket: BUCKET_NAME,
    instruction: 'Send POST request to this endpoint to make bucket publicly readable'
  })
}