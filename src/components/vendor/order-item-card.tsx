'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Decimal } from '@prisma/client/runtime/library'

interface OrderItemCardProps {
  orderItem: {
    id: string
    quantity: number
    price: Decimal
    status: string
    order: {
      id: string
      createdAt: Date
      deliveryTime?: Date | null
      notes?: string | null
      customer: {
        id: string
        name: string
        houseNumber: string | null
        phone?: string | null
      }
    }
    product: {
      id: string
      name: string
      imageUrls: string[]
    }
    shop: {
      id: string
      name: string
    }
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'PREPARING':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'READY':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'DELIVERED':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />
    case 'CONFIRMED':
    case 'PREPARING':
      return <Package className="h-4 w-4" />
    case 'READY':
    case 'DELIVERED':
      return <CheckCircle className="h-4 w-4" />
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

export default function OrderItemCard({ orderItem }: OrderItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(orderItem.status)
  const router = useRouter()

  const updateOrderStatus = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(
        `/api/orders/${orderItem.order.id}/items/${orderItem.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      const updatedItem = await response.json()
      setCurrentStatus(updatedItem.status)
      toast.success(`Order status updated to ${newStatus.toLowerCase().replace('_', ' ')}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(currentStatus)} flex items-center gap-1`}
            >
              {getStatusIcon(currentStatus)}
              {currentStatus.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Order #{orderItem.order.id.slice(-8)}
            </span>
          </div>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {orderItem.product.imageUrls[0] && (
              <Image
                src={orderItem.product.imageUrls[0]}
                alt={orderItem.product.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{orderItem.product.name}</h4>
              <p className="text-sm text-muted-foreground">
                Shop: {orderItem.shop.name}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm">Qty: {orderItem.quantity}</span>
                <span className="font-medium">
                  {formatCurrency(Number(orderItem.price) * orderItem.quantity)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">Customer: {orderItem.order.customer.name}</p>
                <p className="text-muted-foreground">
                  House #{orderItem.order.customer.houseNumber || 'N/A'}
                </p>
                {orderItem.order.customer.phone && (
                  <p className="text-muted-foreground">
                    {orderItem.order.customer.phone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">
                  Ordered: {new Date(orderItem.order.createdAt).toLocaleDateString()}
                </p>
                {orderItem.order.deliveryTime && (
                  <p className="text-muted-foreground">
                    Delivery: {new Date(orderItem.order.deliveryTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {orderItem.order.notes && (
            <div className="bg-muted p-2 rounded text-sm">
              <strong>Notes:</strong> {orderItem.order.notes}
            </div>
          )}

          <div className="flex gap-2">
            {currentStatus === 'PENDING' && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => updateOrderStatus('CONFIRMED')}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Accept Order'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => updateOrderStatus('CANCELLED')}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Decline'}
                </Button>
              </>
            )}
            {currentStatus === 'CONFIRMED' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => updateOrderStatus('PREPARING')}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Start Preparing'}
              </Button>
            )}
            {currentStatus === 'PREPARING' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => updateOrderStatus('READY')}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Mark as Ready'}
              </Button>
            )}
            {currentStatus === 'READY' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => updateOrderStatus('DELIVERED')}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Mark as Delivered'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}