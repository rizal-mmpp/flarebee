
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const externalId = searchParams.get('external_id');
  const source = searchParams.get('source'); // To differentiate if you ever add more payment gateways

  // In a real app, you might want to use externalId to fetch transaction details from Xendit
  // and confirm payment, then provision access to the template.
  // For now, we assume successful redirect means successful payment.

  const purchasedItemName = "Your Awesome Template"; // Placeholder - fetch actual template name if possible
  const downloadLink = "#"; // Placeholder - this would be dynamically generated or fetched

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
            {externalId && <span className="block text-sm mt-1">Order ID: {externalId}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Your download link for "{purchasedItemName}" is available below. You will also receive an email receipt with download information shortly (if email was provided).
          </p>
          <Button asChild size="lg" className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground">
            <a href={downloadLink} download>
              <Download className="mr-2 h-5 w-5" /> Download Now
            </a>
          </Button>
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
