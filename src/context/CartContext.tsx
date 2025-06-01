
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Template, CartItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (template: Template) => void;
  removeFromCart: (templateId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  isItemInCart: (templateId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'flarebeeCart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (error) {
          console.error("Failed to parse cart from localStorage", error);
          localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = useCallback((template: Template) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === template.id);
      if (existingItem) {
        // For templates, we usually don't increase quantity, just ensure it's in cart
        toast({
          title: 'Already in Cart',
          description: `"${template.title}" is already in your cart.`,
        });
        return prevItems;
      }
      toast({
        title: 'Added to Cart',
        description: `"${template.title}" has been added to your cart.`,
      });
      return [...prevItems, { id: template.id, title: template.title, price: template.price, imageUrl: template.imageUrl, quantity: 1 }];
    });
  }, [toast]);

  const removeFromCart = useCallback((templateId: string) => {
    setCartItems((prevItems) => {
      const itemToRemove = prevItems.find(item => item.id === templateId);
      if (itemToRemove) {
         toast({
          title: 'Removed from Cart',
          description: `"${itemToRemove.title}" has been removed from your cart.`,
          variant: 'destructive'
        });
      }
      return prevItems.filter((item) => item.id !== templateId);
    });
  }, [toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast({
        title: 'Cart Cleared',
        description: 'Your shopping cart has been emptied.',
    });
  }, [toast]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const isItemInCart = useCallback((templateId: string) => {
    return cartItems.some(item => item.id === templateId);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, getCartTotal, isItemInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
