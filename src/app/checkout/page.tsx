'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { Store, AlertCircle, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { state, clearCart, getCartTotal } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    houseNumber: '',
    phone: '',
    notes: ''
  })

  // Auto-populate customer info from authenticated user
  useEffect(() => {
    if (user && !authLoading) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.name || '',
        houseNumber: user.houseNumber || '',
        phone: user.phone || ''
      }))
    }
  }, [user, authLoading])

  const [deliveryTime, setDeliveryTime] = useState('')

  const total = getCartTotal()

  // Group items by shop for better organization
  const itemsByShop = state.items.reduce((acc, item) => {
    if (!acc[item.shopId]) {
      acc[item.shopId] = {
        shopName: item.shopName,
        items: [],
        shopTotal: 0
      }
    }
    acc[item.shopId].items.push(item)
    acc[item.shopId].shopTotal += item.price * item.quantity
    return acc
  }, {} as Record<string, { shopName: string; items: typeof state.items; shopTotal: number }>)

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitOrder = async () => {
    // Validate required fields
    if (!customerInfo.name || !customerInfo.houseNumber || !customerInfo.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    if (state.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Validate delivery time if provided
    if (deliveryTime) {
      const selectedTime = new Date(deliveryTime)
      const now = new Date()
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      
      if (selectedTime < twoHoursFromNow) {
        toast.error('Delivery time must be at least 2 hours from now')
        return
      }
      
      // Check business hours (9 AM - 6 PM)
      const hour = selectedTime.getHours()
      if (hour < 9 || hour >= 18) {
        toast.error('Delivery time must be between 9 AM and 6 PM')
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Create the order with debug logging
      const convertedDeliveryTime = deliveryTime ? new Date(deliveryTime).toISOString() : null
      console.log('🔍 Frontend datetime conversion:', {
        original: deliveryTime,
        converted: convertedDeliveryTime
      })
      
      const orderData = {
        customerId: user?.id || null, // Include authenticated user ID
        customerName: customerInfo.name,
        customerHouseNumber: customerInfo.houseNumber,
        customerPhone: customerInfo.phone,
        deliveryTime: convertedDeliveryTime,
        notes: customerInfo.notes || null,
        items: state.items.map(item => ({
          productId: item.productId,
          shopId: item.shopId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place order')
      }

      const order = await response.json()
      
      // Clear cart and redirect to success page
      clearCart()
      toast.success('Order placed successfully!')
      router.push(`/orders/${order.id}`)
      
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Loading...
              </h3>
              <p className="text-gray-600">
                Checking your authentication status
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Please sign in to continue
              </h3>
              <p className="text-gray-600 mb-6">
                You need to be signed in to place an order
              </p>
              <div className="space-x-3">
                <Link href="/auth/login">
                  <Button>
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline">
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-600 mb-6">
                Add some products to your cart before proceeding to checkout
              </p>
              <Link href="/products">
                <Button>
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Review your order and provide delivery details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                  {user && (
                    <span className="text-sm font-normal text-green-600">(Signed in as {user.name})</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className={user?.name ? "bg-green-50 border-green-200" : ""}
                  />
                  {user?.name && (
                    <p className="text-xs text-green-600 mt-1">✓ From your profile</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="houseNumber">House Number *</Label>
                  <Input
                    id="houseNumber"
                    value={customerInfo.houseNumber}
                    onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                    placeholder="e.g., 123"
                    required
                    className={user?.houseNumber ? "bg-green-50 border-green-200" : ""}
                  />
                  {user?.houseNumber && (
                    <p className="text-xs text-green-600 mt-1">✓ From your profile</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="e.g., +66-123-456-789"
                    required
                    className={user?.phone ? "bg-green-50 border-green-200" : ""}
                  />
                  {user?.phone && (
                    <p className="text-xs text-green-600 mt-1">✓ From your profile</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="deliveryTime">Preferred Delivery Time (Optional)</Label>
                  <Input
                    id="deliveryTime"
                    type="datetime-local"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Delivery available 9 AM - 6 PM, minimum 2 hours from now
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Special instructions for delivery..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(itemsByShop).map(([shopId, { shopName, items, shopTotal }]) => (
                    <div key={shopId} className="space-y-3">
                      <div className="flex items-center gap-2 font-medium text-gray-700">
                        <Store className="h-4 w-4" />
                        {shopName}
                      </div>
                      
                      <div className="space-y-3 pl-6">
                        {items.map((item) => (
                          <div key={item.productId} className="flex gap-3">
                            <div className="flex-shrink-0">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="rounded-md object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                                  <Store className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Qty: {item.quantity}</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex justify-between text-sm font-medium pt-2 border-t">
                          <span>Shop Total:</span>
                          <span>{formatCurrency(shopTotal)}</span>
                        </div>
                      </div>
                      
                      {Object.keys(itemsByShop).indexOf(shopId) < Object.keys(itemsByShop).length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? 'Placing Order...' : `Place Order - ${formatCurrency(total)}`}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    By placing this order, you agree to our terms and conditions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}