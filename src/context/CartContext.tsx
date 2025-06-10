
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef } // Added useRef
  from 'react';
import type { Template, CartItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/firebase/AuthContext';
import {
  getUserCartFromFirestore,
  updateUserCartInFirestore,
  deleteUserCartFromFirestore,
} from '@/lib/firebase/firestoreCarts';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (template: Template) => void;
  removeFromCart: (templateId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  isItemInCart: (templateId: string) => boolean;
  cartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_ANONYMOUS_CART_KEY = 'flarebeeAnonymousCart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    const loadCart = async () => {
      if (authLoading) {
        setCartLoading(true);
        return;
      }

      setCartLoading(true);
      if (user) {
        let firestoreCart = await getUserCartFromFirestore(user.uid);
        const localCartJson = localStorage.getItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY);
        let localCartItems: CartItem[] = [];

        if (localCartJson) {
          try {
            localCartItems = JSON.parse(localCartJson);
          } catch (e) {
            console.error("Failed to parse anonymous cart for merging", e);
            localStorage.removeItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY);
          }
        }

        if (firestoreCart) {
          if (localCartItems.length > 0) {
            const mergedItems = [...firestoreCart];
            localCartItems.forEach(localItem => {
              if (!mergedItems.some(fi => fi.id === localItem.id)) {
                mergedItems.push(localItem);
              }
            });
            setCartItems(mergedItems);
            await updateUserCartInFirestore(user.uid, mergedItems);
            localStorage.removeItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY);
            if (localCartItems.length > 0 && localCartItems.some(lc => !firestoreCart.some(fc => fc.id === lc.id)) ) {
                 toast({ title: "Cart Synced", description: "Your anonymous cart items have been merged."});
            }
          } else {
            setCartItems(firestoreCart);
          }
        } else if (localCartItems.length > 0) {
          setCartItems(localCartItems);
          await updateUserCartInFirestore(user.uid, localCartItems);
          localStorage.removeItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY);
           toast({ title: "Cart Synced", description: "Your previous cart items have been saved to your account."});
        } else {
          setCartItems([]);
        }
      } else {
        const localCartJson = localStorage.getItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY);
        if (localCartJson) {
          try {
            setCartItems(JSON.parse(localCartJson));
          } catch (error) {
            console.error("Failed to parse anonymous cart from localStorage", error);
            localStorage.removeItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
      setCartLoading(false);
    };

    loadCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    if (cartLoading || authLoading) return;

    if (user) {
      updateUserCartInFirestore(user.uid, cartItems);
    } else {
      localStorage.setItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, user, cartLoading, authLoading]);

  const addToCart = useCallback((template: Template) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === template.id);
      if (existingItem) {
        setTimeout(() => {
          toast({
            title: 'Already in Cart',
            description: `"${template.title}" is already in your cart.`,
          });
        }, 0);
        return prevItems;
      }
      setTimeout(() => {
        toast({
          title: 'Added to Cart',
          description: `"${template.title}" has been added to your cart.`,
        });
      }, 0);
      return [...prevItems, { id: template.id, title: template.title, price: template.price, imageUrl: template.imageUrl, quantity: 1 }];
    });
  }, [toast]);

  const removeFromCart = useCallback((templateId: string) => {
    setCartItems((prevItems) => {
      const itemToRemove = prevItems.find(item => item.id === templateId);
      const newItems = prevItems.filter((item) => item.id !== templateId);
      if (itemToRemove) {
        setTimeout(() => {
          toast({
            title: 'Removed from Cart',
            description: `"${itemToRemove.title}" has been removed from your cart.`,
            variant: 'destructive'
          });
        }, 0);
      }
      return newItems;
    });
  }, [toast]);

  const clearCart = useCallback(async () => {
    const currentCartHadItems = cartItemsRef.current.length > 0;
    setCartItems([]); 

    if (user && !authLoading) {
      try {
        await deleteUserCartFromFirestore(user.uid);
      } catch (error) {
        console.error("Failed to delete user cart from Firestore:", error);
        setTimeout(() => { 
          toast({
            title: "Cart Sync Issue",
            description: "Could not clear your cart from our servers. It is cleared on this device.",
            variant: "destructive" 
          });
        }, 0);
      }
    }
    
    if (currentCartHadItems) {
        setTimeout(() => {
        toast({
            title: 'Cart Cleared',
            description: 'Your shopping cart has been emptied.',
        });
        }, 0);
    }
  }, [user, authLoading, toast, setCartItems]);


  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const isItemInCart = useCallback((templateId: string) => {
    return cartItems.some(item => item.id === templateId);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, getCartTotal, isItemInCart, cartLoading }}>
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
