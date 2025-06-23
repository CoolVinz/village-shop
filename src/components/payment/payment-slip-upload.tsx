'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Image as ImageIcon, X, Clock } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface PaymentSlipUploadProps {
  orderId: string
  onSuccess?: () => void
}

export function PaymentSlipUpload({ orderId, onSuccess }: PaymentSlipUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a payment slip image')
      return
    }

    setUploading(true)

    try {
      // First upload the image
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', 'payment-slip')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadResult = await uploadResponse.json()

      // Then create the payment slip record
      const paymentSlipData = {
        orderId,
        imageUrl: uploadResult.url,
        notes: notes.trim() || null
      }

      const paymentResponse = await fetch('/api/payment-slips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentSlipData)
      })

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json()
        throw new Error(error.error || 'Failed to submit payment slip')
      }

      toast.success('Payment slip uploaded successfully!')
      
      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      setNotes('')
      
      // Clear file input
      const fileInput = document.getElementById('payment-slip-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      onSuccess?.()
      
    } catch (error) {
      console.error('Error uploading payment slip:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload payment slip')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    
    const fileInput = document.getElementById('payment-slip-file') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Payment Slip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="payment-slip-file">Payment Confirmation Image</Label>
          <Input
            id="payment-slip-file"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Upload a photo of your payment receipt or bank transfer slip
          </p>
        </div>

        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative inline-block">
              <Image
                src={previewUrl}
                alt="Payment slip preview"
                width={400}
                height={256}
                className="max-w-full max-h-64 rounded-lg border object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>{selectedFile?.name}</span>
              <span>({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="payment-notes">Additional Notes (Optional)</Label>
          <Textarea
            id="payment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information about your payment..."
            rows={3}
            disabled={uploading}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Payment Slip
            </>
          )}
        </Button>

        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Payment Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Make payment to the shop owner using their preferred method</li>
            <li>• Take a clear photo of your payment receipt or transfer confirmation</li>
            <li>• Upload the image here for verification</li>
            <li>• Your order will be processed once payment is confirmed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}