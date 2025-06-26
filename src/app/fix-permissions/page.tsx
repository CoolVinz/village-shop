'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FixPermissionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const fixPermissions = async () => {
    setLoading(true)
    setResult('')
    setError('')

    try {
      console.log('🔧 Attempting to fix bucket permissions...')
      
      const response = await fetch('/api/admin/fix-bucket-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log('📡 Response:', data)

      if (response.ok) {
        setResult(`✅ Success: ${data.message}`)
        console.log('✅ Bucket permissions fixed!')
      } else {
        setError(`❌ Error: ${data.error}${data.details ? ` - ${data.details}` : ''}`)
        console.error('❌ Failed to fix permissions:', data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`❌ Network Error: ${errorMessage}`)
      console.error('❌ Network error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Fix MinIO Bucket Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This will set the <code>villager-shop</code> bucket to allow public read access 
            so product images can be displayed in the browser.
          </p>
          
          <div className="space-y-2">
            <p><strong>Current Issue:</strong> AccessDenied when loading images</p>
            <p><strong>Solution:</strong> Set bucket policy to public-read</p>
            <p><strong>Bucket:</strong> <code>villager-shop</code></p>
          </div>

          <Button 
            onClick={fixPermissions} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Fixing Permissions...' : 'Fix Bucket Permissions'}
          </Button>

          {result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {result}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            <p><strong>Alternative methods:</strong></p>
            <div className="bg-gray-50 p-3 rounded mt-2">
              <p>Using MinIO client (mc):</p>
              <code className="block mt-1">mc policy set download villager-shop</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}