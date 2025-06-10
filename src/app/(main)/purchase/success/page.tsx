
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react"; // Added useState

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('external_id');
  // const source = searchParams.get('source'); 

  const { clearCart, cartItems, cartLoading } = useCart();
  const [hasInitiatedCartClear, setHasInitiatedCartClear] = useState(false); // Flag to ensure clear is called once

  useEffect(() => {
    // We want to clear the cart once when this page is visited,
    // and the cart context is no longer loading.
    if (!cartLoading && !hasInitiatedCartClear) {
      if (cartItems.length > 0) { // Only clear if there are items
        clearCart();
      }
      setHasInitiatedCartClear(true); // Mark that we've initiated the clear
    }
  // Added clearCart to dependency array
  }, [cartLoading, cartItems.length, hasInitiatedCartClear, clearCart]);


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
