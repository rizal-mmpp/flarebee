
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
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
    let isMounted = true;

    const performCartClear = async () => {
      if (!cartLoading && !hasInitiatedCartClear && isMounted) {
        setHasInitiatedCartClear(true);
        try {
          await clearCart();
          // Toasts for cart clearing success/issues are handled within clearCart itself
        } catch (error) {
          console.error("Error calling clearCart on success page (unhandled in clearCart):", error);
          if (isMounted) {
            toast({
              title: "Purchase Note",
              description: "Your purchase was successful. There was an issue clearing your cart automatically.",
              variant: "destructive"
            });
          }
        }
      }
    };

    performCartClear();

    return () => {
      isMounted = false;
    };
    // Dependencies:
    // - cartLoading: Effect should run when cart is no longer loading.
    // - hasInitiatedCartClear: Local state, effect re-runs, internal condition prevents re-execution of clearCart.
    // - clearCart: Function from context. If its identity changes, effect re-runs. Guarded by hasInitiatedCartClear.
    // - toast: Stable function from useToast.
  }, [cartLoading, hasInitiatedCartClear, clearCart, toast]);


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
