'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Clock, Eye, User, MapPin, Package } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface PaymentSlip {
  id: string
  orderId: string
  imageUrl: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  notes: string | null
  createdAt: string
  updatedAt: string
  order: {
    id: string
    totalAmount: number
    customerHouseNumber: string
    customer: {
      id: string
      name: string
      houseNumber: string | null
    }
  }
}

export function PaymentVerification() {
  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [selectedSlip, setSelectedSlip] = useState<PaymentSlip | null>(null)
  const [verificationNotes, setVerificationNotes] = useState('')

  useEffect(() => {
    fetchPaymentSlips()
  }, [])

  const fetchPaymentSlips = async () => {
    try {
      const response = await fetch('/api/payment-slips?status=PENDING')
      if (response.ok) {
        const data = await response.json()
        setPaymentSlips(data)
      } else {
        toast.error('Failed to fetch payment slips')
      }
    } catch (error) {
      console.error('Error fetching payment slips:', error)
      toast.error('Error loading payment slips')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPayment = async (paymentSlipId: string, status: 'VERIFIED' | 'REJECTED') => {
    setVerifying(paymentSlipId)
    
    try {
      const response = await fetch('/api/payment-slips', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentSlipId,
          status,
          notes: verificationNotes.trim() || null
        })
      })

      if (response.ok) {
        toast.success(`Payment ${status.toLowerCase()} successfully`)
        
        // Remove the verified slip from the list
        setPaymentSlips(prev => prev.filter(slip => slip.id !== paymentSlipId))
        setSelectedSlip(null)
        setVerificationNotes('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update payment status')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast.error('Error updating payment status')
    } finally {
      setVerifying(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'VERIFIED':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            Loading payment slips...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (paymentSlips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending payment slips to verify
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Payment Verification ({paymentSlips.length} pending)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {paymentSlips.map((slip) => (
              <Card key={slip.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{slip.order.customer.name}</span>
                        {getStatusBadge(slip.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          House {slip.order.customerHouseNumber}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Order #{slip.orderId.slice(-8)}
                        </div>
                      </div>

                      <div className="text-lg font-semibold">
                        ฿{slip.order.totalAmount.toLocaleString()}
                      </div>

                      {slip.notes && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Customer notes:</strong> {slip.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSlip(slip)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Slip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedSlip && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Payment Slip Verification</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedSlip(null)
                  setVerificationNotes('')
                }}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Customer:</strong> {selectedSlip.order.customer.name}</div>
                  <div><strong>House:</strong> {selectedSlip.order.customerHouseNumber}</div>
                  <div><strong>Order ID:</strong> {selectedSlip.orderId}</div>
                  <div><strong>Amount:</strong> ฿{selectedSlip.order.totalAmount.toLocaleString()}</div>
                  <div><strong>Submitted:</strong> {new Date(selectedSlip.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Payment Slip</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Image
                    src={selectedSlip.imageUrl}
                    alt="Payment slip"
                    width={400}
                    height={300}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
              <Textarea
                id="verification-notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any notes about the verification..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleVerifyPayment(selectedSlip.id, 'VERIFIED')}
                disabled={verifying === selectedSlip.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {verifying === selectedSlip.id ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verify Payment
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleVerifyPayment(selectedSlip.id, 'REJECTED')}
                disabled={verifying === selectedSlip.id}
              >
                {verifying === selectedSlip.id ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}