'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
    imageUrls: string[]
    shop: {
      id: string
      name: string
    }
  }
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart, state } = useCart()

  const existingItem = state.items.find(item => item.productId === product.id)
  const currentQuantityInCart = existingItem?.quantity || 0

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrls[0],
      shopId: product.shop.id,
      shopName: product.shop.name,
      quantity
    })
    setQuantity(1) // Reset to 1 after adding
  }

  const isOutOfStock = product.stock <= 0
  const isMaxQuantity = currentQuantityInCart + quantity >= product.stock

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center border rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
            onClick={() => setQuantity(Math.min(product.stock - currentQuantityInCart, quantity + 1))}
            disabled={quantity >= product.stock - currentQuantityInCart}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm text-gray-500">
          ({product.stock - currentQuantityInCart} available)
        </span>
      </div>

      {/* Add to Cart Button */}
      <Button 
        size="lg" 
        className="w-full"
        onClick={handleAddToCart}
        disabled={isOutOfStock || isMaxQuantity || quantity <= 0}
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        {isOutOfStock 
          ? 'Out of Stock' 
          : isMaxQuantity 
          ? 'Max Quantity in Cart'
          : `Add ${quantity} to Cart`
        }
      </Button>

      {currentQuantityInCart > 0 && (
        <p className="text-sm text-gray-600 text-center">
          {currentQuantityInCart} already in cart
        </p>
      )}
    </div>
  )
}