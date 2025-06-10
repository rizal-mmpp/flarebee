
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const LOCAL_STORAGE_ANONYMOUS_CART_KEY = 'flarebeeAnonymousCart_v1'; // Added versioning

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadCart = async () => {
      if (authLoading) {
        setCartLoading(true); // Keep loading if auth is still resolving
        return;
      }

      setCartLoading(true);
      if (user) {
        // User is logged in
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
          // Firestore cart exists. If local cart also exists, merge them (Firestore takes precedence for existing items)
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
            if (localCartItems.length > 0 && localCartItems.some(lc => !firestoreCart.some(fc => fc.id === lc.id)) ) { // Only toast if new items were actually merged
                 toast({ title: "Cart Synced", description: "Your anonymous cart items have been merged."});
            }
          } else {
            setCartItems(firestoreCart);
          }
        } else if (localCartItems.length > 0) {
          // No Firestore cart, but local anonymous cart exists. Use it and save to Firestore.
          setCartItems(localCartItems);
          await updateUserCartInFirestore(user.uid, localCartItems);
          localStorage.removeItem(LOCAL_STORAGE_ANONYMOUS_CART_KEY);
           toast({ title: "Cart Synced", description: "Your previous cart items have been saved to your account."});
        } else {
          // No Firestore cart, no local cart
          setCartItems([]);
        }
      } else {
        // User is logged out, load from localStorage (anonymous cart)
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
  }, [user, authLoading]); // Toast is stable, no need to add.

  useEffect(() => {
    if (cartLoading || authLoading) return; // Don't save while loading or auth resolving

    // Only save if cartItems has actually been initialized/modified after initial load.
    // This check prevents overwriting Firestore with an empty array if loadCart hasn't finished.
    // A more robust check might involve comparing with a "previousCartItems" state.
    // For now, relying on cartLoading to gate this.

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
    const currentCartHadItems = cartItems.length > 0;
    setCartItems([]);
    if (user && !authLoading && !cartLoading) {
      await deleteUserCartFromFirestore(user.uid);
    }
    // For anonymous user, the useEffect for cartItems will clear localStorage.
    if (currentCartHadItems) { // Only toast if cart wasn't already empty
        setTimeout(() => {
        toast({
            title: 'Cart Cleared',
            description: 'Your shopping cart has been emptied.',
        });
        }, 0);
    }
  }, [cartItems.length, user, authLoading, cartLoading, toast]);


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
