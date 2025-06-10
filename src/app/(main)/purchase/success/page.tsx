
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('external_id');
  
  const { clearCart, cartLoading } = useCart(); 
  const { toast } = useToast();
  const [hasInitiatedCartClear, setHasInitiatedCartClear] = useState(false);

  useEffect(() => {
    let isMounted = true; // Flag to check if component is still mounted

    const performCartClear = async () => {
      // Ensure cart is not loading, clear operation hasn't been initiated, and component is mounted
      if (!cartLoading && !hasInitiatedCartClear && isMounted) {
        try {
          await clearCart(); // Await the async clearCart operation
          if (isMounted) {
            // Toast for cart cleared is handled within clearCart, no need to repeat unless specific to success page
            setHasInitiatedCartClear(true);
          }
        } catch (error) {
          console.error("Error calling clearCart on success page:", error);
          if (isMounted) {
            toast({
              title: "Purchase Note",
              description: "Your purchase was successful. There was an issue clearing your cart automatically, please check your cart.",
              variant: "destructive" 
            });
            setHasInitiatedCartClear(true); // Mark as initiated even on error to prevent loops
          }
        }
      }
    };

    performCartClear();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, [cartLoading, hasInitiatedCartClear, clearCart, toast]); // Dependencies for the effect


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
