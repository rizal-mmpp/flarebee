
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('external_id');

  const { clearCart, cartLoading, cartItems } = useCart();
  const { toast } = useToast(); // For potential fallback toasts
  const [hasInitiatedCartClear, setHasInitiatedCartClear] = useState(false);
  const isMountedRef = useRef(true); // Use a ref for isMounted

  useEffect(() => {
    // Set isMounted to true on mount
    isMountedRef.current = true;
    // Set isMounted to false on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const performCartClear = async () => {
      // Proceed if:
      // - cart is not in its initial loading state
      // - clear operation hasn't been initiated yet for this page instance
      // - the component is still mounted
      if (!cartLoading && !hasInitiatedCartClear && isMountedRef.current) {
        setHasInitiatedCartClear(true); // Set flag *before* async operation
        
        // Only attempt to clear if there are items.
        // For logged-in users, server action might have already cleared Firestore,
        // and CartContext might have loaded an empty cart.
        if (cartItems.length > 0) {
          try {
            await clearCart(); 
            // Success toasts are now handled within clearCart itself.
            // If clearCart needs to show a toast, it will.
          } catch (error) {
            console.error("Error calling clearCart on success page:", error);
            if (isMountedRef.current) {
              toast({
                title: "Purchase Note",
                description: "Your purchase was successful. There was an issue automatically clearing your cart from this device.",
                variant: "destructive" 
              });
            }
          }
        }
      }
    };

    performCartClear();

  // Dependencies:
  // - cartLoading: Effect runs when cart loading state changes.
  // - hasInitiatedCartClear: Prevents re-running logic if already initiated.
  // - clearCart: Function from context. Its identity is stable or handled by hasInitiatedCartClear.
  // - cartItems: Used to check cartItems.length.
  // - toast, setHasInitiatedCartClear: Stable setters/functions.
  }, [cartLoading, hasInitiatedCartClear, clearCart, toast, cartItems, setHasInitiatedCartClear]);


  const purchasedItemsDescription = "Your purchased items"; 
  const downloadInfo = "Download links for your purchased items will be available in your account or sent via email.";

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-lg text-center shadow-xl bg-card">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Payment Successful!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Thank you for your purchase.
            {orderId && <span className="block text-sm mt-1">Order ID: {orderId}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Your order for "{purchasedItemsDescription}" has been processed.
            {downloadInfo}
            You will also receive an email receipt shortly (if an email was provided).
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" asChild size="lg" className="w-full group">
              <Link href="/templates">
                <ShoppingBag className="mr-2 h-5 w-5" /> Continue Shopping
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="w-full group">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" /> Go to Homepage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
