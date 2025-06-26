'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Upload, X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  price: z.number().min(1, 'Price must be at least 1 THB'),
  stock: z.number().min(0, 'Stock cannot be negative').int(),
  category: z.string().optional(),
  shopId: z.string().min(1, 'Please select a shop'),
  isAvailable: z.boolean(),
})

type ProductFormData = z.infer<typeof productSchema>

interface Shop {
  id: string
  name: string
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  category: string | null
  shopId: string
  isAvailable: boolean
  imageUrls: string[]
  shop: {
    id: string
    name: string
  }
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [productId, setProductId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const isAvailable = watch('isAvailable')

  // Resolve params Promise
  useEffect(() => {
    params.then(({ id }) => setProductId(id))
  }, [params])

  // Fetch product data and shops
  useEffect(() => {
    if (productId) {
      fetchProduct()
      fetchShops()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      console.log('🚀 Fetching product with ID:', productId)
      const response = await fetch(`/api/products/${productId}`)
      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Product not found`)
      }
      
      const productData = await response.json()
      console.log('🔍 Product data loaded:', productData)
      console.log('🖼️ Image URLs:', productData.imageUrls)
      setProduct(productData)
      setExistingImages(productData.imageUrls || [])
      
      // Reset form with product data
      reset({
        name: productData.name,
        description: productData.description || '',
        price: Number(productData.price),
        stock: productData.stock,
        category: productData.category || '',
        shopId: productData.shopId,
        isAvailable: productData.isAvailable,
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      router.push('/vendor/products')
    }
  }

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops?ownerId=current')
      if (response.ok) {
        const shopsData = await response.json()
        setShops(shopsData.filter((shop: Shop) => shop.isActive))
      }
    } catch (error) {
      console.error('Error fetching shops:', error)
      toast.error('Failed to load shops')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + imageFiles.length + existingImages.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    const newFiles = [...imageFiles, ...files]
    setImageFiles(newFiles)

    // Create previews
    const newPreviews = [...imagePreviews]
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        setImagePreviews([...newPreviews])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImageFiles(newFiles)
    setImagePreviews(newPreviews)
  }

  const removeExistingImage = (index: number) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index)
    setExistingImages(newExistingImages)
  }

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return []
    
    setUploadingImages(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'product')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload image')
        }

        const data = await response.json()
        return data.url
      })

      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
      return []
    } finally {
      setUploadingImages(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)

    try {
      // Upload new images
      const newImageUrls = await uploadImages(imageFiles)
      
      // Combine existing and new images
      const allImageUrls = [...existingImages, ...newImageUrls]

      const productData = {
        ...data,
        imageUrls: allImageUrls,
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }

      toast.success('Product updated successfully!')
      router.push('/vendor/products')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      toast.success('Product deleted successfully!')
      router.push('/vendor/products')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setIsLoading(false)
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendor/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update your product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Update the basic information about your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopId">Shop *</Label>
                <Select
                  value={watch('shopId')}
                  onValueChange={(value) => setValue('shopId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.shopId && (
                  <p className="text-sm text-red-500">{errors.shopId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your product..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (THB) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  min="1"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-sm text-red-500">{errors.stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Food, Electronics"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={isAvailable}
                onCheckedChange={(checked) => setValue('isAvailable', checked)}
              />
              <Label htmlFor="isAvailable">Product is available for sale</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>
              Update product images (maximum 5 images)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Current Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="w-[150px] h-[150px] relative overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={url}
                          alt={`Product image ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={() => {
                            console.error('Image load error for URL:', url)
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {imagePreviews.length > 0 && (
              <div>
                <Label className="text-sm font-medium">New Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <div className="w-[150px] h-[150px] relative overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={preview}
                          alt={`New image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div>
              <Label htmlFor="images">Add More Images</Label>
              <div className="mt-2 flex items-center justify-center w-full">
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Product'
            )}
          </Button>

          <div className="flex gap-2">
            <Link href="/vendor/products">
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading || uploadingImages}
            >
              {isLoading || uploadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImages ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}