
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PurchaseCancelledPage() {
  const searchParams = useSearchParams();
  // Xendit uses 'external_id' in the redirect URL
  const orderId = searchParams.get('external_id') || searchParams.get('order_id'); 
  // const source = searchParams.get('source'); // Available if needed

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-lg text-center bg-card"> {/* Removed shadow-xl */}
        <CardHeader>
          <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Payment Cancelled or Failed</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Your purchase process was cancelled or failed.
            {orderId && <span className="block text-sm mt-1">Order ID: {orderId}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            It seems you have cancelled the payment or something went wrong during the process. Your order has not been fully processed.
            If you believe this is an error, please try again or contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" asChild size="lg" className="w-full group">
              <Link href="/checkout"> 
                <ShoppingBag className="mr-2 h-5 w-5" /> View Cart
              </Link>
            </Button>
            <Button asChild size="lg" className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground">
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
