import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home } from "lucide-react";
import Link from "next/link";

export default function PurchaseSuccessPage() {
  // In a real app, you'd fetch order details using a query param like session_id
  const purchasedItemName = "Your Awesome Template"; // Placeholder
  const downloadLink = "#"; // Placeholder

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-lg text-center shadow-xl bg-card">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Payment Successful!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Thank you for your purchase of {purchasedItemName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Your download link is available below. You will also receive an email receipt with download information shortly.
          </p>
          <Button asChild size="lg" className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground">
            <a href={downloadLink} download> {/* Use actual download link */}
              <Download className="mr-2 h-5 w-5" /> Download Now
            </a>
          </Button>
          <Button variant="outline" asChild size="lg" className="w-full group">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" /> Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
