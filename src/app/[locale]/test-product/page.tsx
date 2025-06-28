'use client'

import { useEffect, useState } from 'react'

export default function TestProductPage() {
  const [productData, setProductData] = useState<unknown>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testProduct = async () => {
      try {
        console.log('🧪 Testing product API...')
        const response = await fetch('/api/products/cmcd3wsg00001qe0koqy4f4rd')
        console.log('📡 Response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.text()
          console.error('❌ Error response:', errorData)
          setError(`HTTP ${response.status}: ${errorData}`)
          return
        }
        
        const data = await response.json()
        console.log('✅ Product data:', data)
        setProductData(data)
      } catch (err) {
        console.error('❌ Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    testProduct()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Product API Test</h1>
      <p className="mb-4">Testing product ID: <code>cmcd3wsg00001qe0koqy4f4rd</code></p>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      ) : productData ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success!</strong> Product found
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(productData, null, 2)}
          </pre>
        </div>
      ) : null}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Check browser console for detailed logs</h2>
        <p className="text-gray-600">Open DevTools → Console to see API request details</p>
      </div>
    </div>
  )
}