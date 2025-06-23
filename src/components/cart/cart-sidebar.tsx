'use client'

import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, Plus, Minus, Trash2, Store } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export function CartSidebar() {
  const { 
    state, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartTotal, 
    getCartItemCount,
    toggleCart,
    closeCart
  } = useCart()

  const itemCount = getCartItemCount()
  const total = getCartTotal()

  // Group items by shop
  const itemsByShop = state.items.reduce((acc, item) => {
    if (!acc[item.shopId]) {
      acc[item.shopId] = {
        shopName: item.shopName,
        items: []
      }
    }
    acc[item.shopId].items.push(item)
    return acc
  }, {} as Record<string, { shopName: string; items: typeof state.items }>)

  const handleCheckout = () => {
    closeCart()
    // Navigate to checkout page (we'll implement this next)
    window.location.href = '/checkout'
  }

  return (
    <Sheet open={state.isOpen} onOpenChange={toggleCart}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({itemCount} items)
          </SheetTitle>
        </SheetHeader>

        {state.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-6">
              Add some products to get started
            </p>
            <Link href="/products">
              <Button onClick={closeCart}>
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 mt-6">
              <div className="space-y-6">
                {Object.entries(itemsByShop).map(([shopId, { shopName, items }]) => (
                  <div key={shopId} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Store className="h-4 w-4" />
                      {shopName}
                    </div>
                    
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.productId} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={60}
                                height={60}
                                className="rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-15 h-15 bg-gray-200 rounded-md flex items-center justify-center">
                                <ShoppingCart className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(item.price)} each
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.stock} available
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="mx-2 text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= item.stock}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => removeFromCart(item.productId)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div className="space-y-2">
                <Button onClick={handleCheckout} className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearCart} 
                  className="w-full"
                  size="sm"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}