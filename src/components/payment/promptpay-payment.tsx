'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QrCode, Smartphone, CreditCard, Upload } from 'lucide-react'
import { formatThaiBaht } from '@/lib/thai-utils'

interface PromptPayPaymentProps {
  amount: number
  recipientId: string // Phone number or National ID
  recipientName: string
  orderNumber?: string
  onPaymentUpload?: (file: File) => void
}

export function PromptPayPayment({ 
  amount, 
  recipientId, 
  recipientName, 
  orderNumber,
  onPaymentUpload 
}: PromptPayPaymentProps) {
  const t = useTranslations('payment')
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setPaymentSlip(file)
    
    if (onPaymentUpload) {
      setIsUploading(true)
      try {
        await onPaymentUpload(file)
      } finally {
        setIsUploading(false)
      }
    }
  }

  // In real implementation, generate QR data for PromptPay here

  return (
    <div className="space-y-6">
      {/* PromptPay Header */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-700 thai-text">
              <Smartphone className="h-5 w-5" />
              {t('promptPay')}
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 thai-text">
              แนะนำ
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="thai-text">รายละเอียดการชำระเงิน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600 thai-text">ผู้รับเงิน</Label>
              <p className="font-medium thai-text">{recipientName}</p>
            </div>
            <div>
              <Label className="text-gray-600 thai-text">หมายเลข PromptPay</Label>
              <p className="font-mono">{recipientId}</p>
            </div>
            <div>
              <Label className="text-gray-600 thai-text">จำนวนเงิน</Label>
              <p className="font-bold text-lg thai-numerals">{formatThaiBaht(amount)}</p>
            </div>
            {orderNumber && (
              <div>
                <Label className="text-gray-600 thai-text">หมายเลขคำสั่งซื้อ</Label>
                <p className="font-mono">{orderNumber}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 thai-text">
            <QrCode className="h-5 w-5" />
            สแกน QR Code เพื่อชำระเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            {/* Mock QR Code - in real implementation, use actual QR code library */}
            <div className="mx-auto w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center promptpay-qr">
              <div className="text-center">
                <QrCode className="h-20 w-20 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 thai-text">QR Code สำหรับ PromptPay</p>
                <p className="text-xs text-gray-500 thai-numerals">{formatThaiBaht(amount)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 thai-text">
                1. เปิดแอปธนาคารหรือแอป PromptPay
              </p>
              <p className="text-sm text-gray-600 thai-text">
                2. สแกน QR Code ด้านบน
              </p>
              <p className="text-sm text-gray-600 thai-text">
                3. ตรวจสอบจำนวนเงินและชำระเงิน
              </p>
              <p className="text-sm text-gray-600 thai-text">
                4. อัปโหลดสลิปโอนเงินด้านล่าง
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Transfer Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 thai-text">
            <CreditCard className="h-5 w-5" />
            โอนเงินด้วยตนเอง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium thai-text">หากไม่สามารถสแกน QR Code ได้</p>
            <p className="text-sm text-gray-600 thai-text">
              ใช้หมายเลข PromptPay: <span className="font-mono font-bold">{recipientId}</span>
            </p>
            <p className="text-sm text-gray-600 thai-text">
              จำนวนเงิน: <span className="font-bold thai-numerals">{formatThaiBaht(amount)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Slip Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 thai-text">
            <Upload className="h-5 w-5" />
            {t('uploadSlip')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <Label htmlFor="payment-slip" className="cursor-pointer">
              <p className="text-sm font-medium thai-text">
                คลิกเพื่ือเลือกไฟล์สลิปโอนเงิน
              </p>
              <p className="text-xs text-gray-500 thai-text">
                รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 5MB
              </p>
              <Input
                id="payment-slip"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </Label>
          </div>

          {paymentSlip && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium thai-text">
                  อัปโหลดไฟล์: {paymentSlip.name}
                </span>
              </div>
            </div>
          )}

          <Button 
            className="w-full thai-text" 
            disabled={!paymentSlip || isUploading}
          >
            {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน'}
          </Button>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-3 thai-text">ข้อดีของการชำระเงินผ่าน PromptPay</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2 thai-text">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              โอนเงินได้ 24 ชั่วโมง ทุกวัน
            </li>
            <li className="flex items-center gap-2 thai-text">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              ไม่มีค่าธรรมเนียมการโอน
            </li>
            <li className="flex items-center gap-2 thai-text">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              รวดเร็วและปลอดภัย
            </li>
            <li className="flex items-center gap-2 thai-text">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              รองรับทุกธนาคารในประเทศไทย
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}