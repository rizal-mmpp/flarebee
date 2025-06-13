
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, ShoppingBag, LayoutDashboard } from "lucide-react"; // Added LayoutDashboard
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('external_id') || searchParams.get('order_id'); 

  const { clearCart, cartLoading, cartItems } = useCart();
  const { toast } = useToast();
  const [hasInitiatedCartClear, setHasInitiatedCartClear] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const performCartClear = async () => {
      if (!cartLoading && !hasInitiatedCartClear && isMountedRef.current) {
        setHasInitiatedCartClear(true); 
        
        if (cartItems.length > 0) {
          try {
            await clearCart(); 
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
  }, [cartLoading, hasInitiatedCartClear, clearCart, toast, cartItems]);


  const purchasedItemsDescription = "Your items"; 
  const accessInfo = "Access to purchased templates and order status will be available in your dashboard once payment is fully confirmed.";

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-lg text-center bg-card"> {/* Removed shadow-xl */}
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Payment Process Initiated!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Thank you! Your payment for "{purchasedItemsDescription}" is being processed.
            {orderId && <span className="block text-sm mt-1">Order ID: {orderId}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            You will receive an email receipt from Xendit shortly (if an email was provided). 
            {accessInfo} If your payment is pending, you can also find the payment link in your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" asChild size="lg" className="w-full group">
              <Link href="/templates">
                <ShoppingBag className="mr-2 h-5 w-5" /> Continue Shopping
              </Link>
            </Button>
            <Button variant="default" asChild size="lg" className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard"> 
                <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
