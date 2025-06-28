'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Home } from 'lucide-react'
import { formatThaiAddress } from '@/lib/thai-utils'

interface ThaiAddress {
  houseNumber: string
  village?: string
  road?: string
  subdistrict: string
  district: string
  province: string
  postalCode: string
}

interface ThaiAddressFormProps {
  initialAddress?: Partial<ThaiAddress>
  onAddressChange?: (address: ThaiAddress) => void
  onSave?: (address: ThaiAddress) => void
  isLoading?: boolean
}

// Mock data - in real app, this would come from an API
const PROVINCES = [
  'กรุงเทพมหานคร',
  'นนทบุรี', 
  'ปทุมธานี',
  'สมุทรปราการ',
  'นครปธม',
  'เชียงใหม่',
  'เชียงราย',
  'ขอนแก่น',
  'อุดรธานี',
  'หาดใหญ่',
  'ภูเก็ต',
  'สงขลา'
]

export function ThaiAddressForm({ 
  initialAddress, 
  onAddressChange, 
  onSave, 
  isLoading = false 
}: ThaiAddressFormProps) {
  const t = useTranslations('address')
  
  const [address, setAddress] = useState<ThaiAddress>({
    houseNumber: initialAddress?.houseNumber || '',
    village: initialAddress?.village || '',
    road: initialAddress?.road || '',
    subdistrict: initialAddress?.subdistrict || '',
    district: initialAddress?.district || '',
    province: initialAddress?.province || '',
    postalCode: initialAddress?.postalCode || ''
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ThaiAddress, string>>>({})

  const handleInputChange = (field: keyof ThaiAddress, value: string) => {
    const updatedAddress = { ...address, [field]: value }
    setAddress(updatedAddress)
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    onAddressChange?.(updatedAddress)
  }

  const validateAddress = (): boolean => {
    const newErrors: Partial<Record<keyof ThaiAddress, string>> = {}

    if (!address.houseNumber.trim()) {
      newErrors.houseNumber = 'กรุณากรอกบ้านเลขที่'
    }

    if (!address.subdistrict.trim()) {
      newErrors.subdistrict = 'กรุณากรอกตำบล'
    }

    if (!address.district.trim()) {
      newErrors.district = 'กรุณากรอกอำเภอ'
    }

    if (!address.province.trim()) {
      newErrors.province = 'กรุณาเลือกจังหวัด'
    }

    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'กรุณากรอกรหัสไปรษณีย์'
    } else if (!/^\d{5}$/.test(address.postalCode)) {
      newErrors.postalCode = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateAddress()) {
      onSave?.(address)
    }
  }

  const formattedAddress = formatThaiAddress(address)

  return (
    <div className="space-y-6">
      {/* Address Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 thai-text">
            <Home className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* House Number */}
            <div className="md:col-span-1">
              <Label htmlFor="houseNumber" className="thai-text">
                {t('houseNumber')} *
              </Label>
              <Input
                id="houseNumber"
                value={address.houseNumber}
                onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                placeholder="เช่น 123/45"
                className={errors.houseNumber ? 'border-red-500' : ''}
              />
              {errors.houseNumber && (
                <p className="text-sm text-red-500 mt-1 thai-text">{errors.houseNumber}</p>
              )}
            </div>

            {/* Village/Moo */}
            <div className="md:col-span-1">
              <Label htmlFor="village" className="thai-text">
                {t('village')}
              </Label>
              <Input
                id="village"
                value={address.village || ''}
                onChange={(e) => handleInputChange('village', e.target.value)}
                placeholder="เช่น 5 หรือ บ้านสวนดอก"
              />
            </div>

            {/* Road/Soi */}
            <div className="md:col-span-2">
              <Label htmlFor="road" className="thai-text">
                {t('road')}
              </Label>
              <Input
                id="road"
                value={address.road || ''}
                onChange={(e) => handleInputChange('road', e.target.value)}
                placeholder="เช่น ซอยรามคำแหง 24 หรือ ถนนสุขุมวิท"
              />
            </div>

            {/* Subdistrict */}
            <div>
              <Label htmlFor="subdistrict" className="thai-text">
                {t('subdistrict')} *
              </Label>
              <Input
                id="subdistrict"
                value={address.subdistrict}
                onChange={(e) => handleInputChange('subdistrict', e.target.value)}
                placeholder="เช่น หัวหมาก"
                className={errors.subdistrict ? 'border-red-500' : ''}
              />
              {errors.subdistrict && (
                <p className="text-sm text-red-500 mt-1 thai-text">{errors.subdistrict}</p>
              )}
            </div>

            {/* District */}
            <div>
              <Label htmlFor="district" className="thai-text">
                {t('district')} *
              </Label>
              <Input
                id="district"
                value={address.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                placeholder="เช่น วังทองหลาง"
                className={errors.district ? 'border-red-500' : ''}
              />
              {errors.district && (
                <p className="text-sm text-red-500 mt-1 thai-text">{errors.district}</p>
              )}
            </div>

            {/* Province */}
            <div>
              <Label htmlFor="province" className="thai-text">
                {t('province')} *
              </Label>
              <Select 
                value={address.province} 
                onValueChange={(value) => handleInputChange('province', value)}
              >
                <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province} value={province} className="thai-text">
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && (
                <p className="text-sm text-red-500 mt-1 thai-text">{errors.province}</p>
              )}
            </div>

            {/* Postal Code */}
            <div>
              <Label htmlFor="postalCode" className="thai-text">
                {t('postalCode')} *
              </Label>
              <Input
                id="postalCode"
                value={address.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="เช่น 10310"
                maxLength={5}
                pattern="[0-9]{5}"
                className={errors.postalCode ? 'border-red-500' : ''}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-500 mt-1 thai-text">{errors.postalCode}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Preview */}
      {formattedAddress && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 thai-text">
              <MapPin className="h-5 w-5" />
              ที่อยู่ที่จัดรูปแบบแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="thai-text text-gray-800">{formattedAddress}</p>
              <p className="text-sm text-gray-600 mt-2 thai-text">ประเทศไทย</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="thai-text"
          >
            {isLoading ? 'กำลังบันทึก...' : t('addressSaved')}
          </Button>
        </div>
      )}

      {/* Address Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700 thai-text">เคล็ดลับการกรอกที่อยู่</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2 thai-text">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
              <span>บ้านเลขที่: ใส่ตามที่ปรากฏในเอกสารทางราชการ เช่น 123/45</span>
            </li>
            <li className="flex items-start gap-2 thai-text">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
              <span>หมู่บ้าน: ใส่หมายเลขหมู่หรือชื่อโครงการ เช่น หมู่ 5 หรือ บ้านสวนดอก</span>
            </li>
            <li className="flex items-start gap-2 thai-text">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
              <span>ถนน/ซอย: ระบุชื่อถนนหรือซอยที่ครัวเรือนตั้งอยู่</span>
            </li>
            <li className="flex items-start gap-2 thai-text">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
              <span>รหัสไปรษณีย์: ต้องเป็นตัวเลข 5 หลัก</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}