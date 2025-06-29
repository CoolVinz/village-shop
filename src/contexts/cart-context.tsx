'use client'

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useNextAuth } from '@/hooks/useNextAuth'
import { SessionUser } from '@/lib/auth'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
  imageUrl?: string
  shopId: string
  shopName: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  currentUser: SessionUser | null
  isAuthenticated: boolean
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId)
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + (action.payload.quantity || 1)
        if (newQuantity > existingItem.stock) {
          toast.error(`Only ${existingItem.stock} items available in stock`)
          return state
        }
        
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        }
      }
      
      const quantity = action.payload.quantity || 1
      if (quantity > action.payload.stock) {
        toast.error(`Only ${action.payload.stock} items available in stock`)
        return state
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity }]
      }
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload.productId)
      }
    
    case 'UPDATE_QUANTITY': {
      const item = state.items.find(item => item.productId === action.payload.productId)
      if (!item) return state
      
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.productId !== action.payload.productId)
        }
      }
      
      if (action.payload.quantity > item.stock) {
        toast.error(`Only ${item.stock} items available in stock`)
        return state
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      }
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen
      }
    
    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true
      }
    
    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false
      }
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload
      }
    
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useNextAuth()
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false
  })

  // Get user-specific cart storage key
  const getCartStorageKey = useCallback(() => {
    if (user?.id) {
      return `village-cart-${user.id}`
    }
    return 'village-cart-anonymous'
  }, [user?.id])

  // Load cart from localStorage when user changes or on mount
  useEffect(() => {
    if (authLoading) return // Wait for auth to finish loading

    const cartKey = getCartStorageKey()
    const savedCart = localStorage.getItem(cartKey)
    
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Clear corrupted cart data
        localStorage.removeItem(cartKey)
        dispatch({ type: 'CLEAR_CART' })
      }
    } else {
      // No saved cart for this user, start fresh
      dispatch({ type: 'CLEAR_CART' })
    }
  }, [user?.id, authLoading, getCartStorageKey])

  // Save cart to localStorage whenever items change (with user-specific key)
  useEffect(() => {
    if (authLoading) return // Don't save during auth loading

    const cartKey = getCartStorageKey()
    localStorage.setItem(cartKey, JSON.stringify(state.items))
  }, [state.items, user?.id, authLoading, getCartStorageKey])

  // Clear cart when user logs out
  useEffect(() => {
    if (!authLoading && !user) {
      // User logged out, clear cart
      dispatch({ type: 'CLEAR_CART' })
      
      // Clean up any anonymous cart data
      const anonymousKey = 'village-cart-anonymous'
      localStorage.removeItem(anonymousKey)
      
      // Also clean up old global cart key for migration
      localStorage.removeItem('village-cart')
    }
  }, [user, authLoading])

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
    toast.success(`${item.name} added to cart`)
  }

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
    toast.success('Item removed from cart')
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    toast.success('Cart cleared')
  }

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' })
  const openCart = () => dispatch({ type: 'OPEN_CART' })
  const closeCart = () => dispatch({ type: 'CLOSE_CART' })

  return (
    <CartContext.Provider value={{
      state,
      dispatch,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      toggleCart,
      openCart,
      closeCart,
      currentUser: user,
      isAuthenticated: !!user && !authLoading
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}