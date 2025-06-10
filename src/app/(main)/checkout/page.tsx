
'use client';

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, CreditCard, ShoppingBag, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { createXenditInvoice } from '@/lib/actions/xendit.actions';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Removed useTransition, added useState
import { toast } from '@/hooks/use-toast';

interface XenditItem {
  name: string;
  quantity: number;
  price: number;
  category?: string; // Optional, as per Xendit docs
  // url?: string; // Optional
}

export default function CheckoutPage() {
  const { cartItems, removeFromCart, getCartTotal, clearCart, cartLoading } = useCart();
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const router = useRouter();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Replaced useTransition

  const totalAmount = getCartTotal();

  useEffect(() => {
    if (!authLoading && !user && !cartLoading) { // Ensure cart isn't loading either before redirecting
      toast({
        title: "Login Required",
        description: "Please log in to view your cart and proceed to checkout.",
        variant: "destructive",
      });
      router.replace('/'); // Redirect to homepage if not logged in
    }
  }, [user, authLoading, cartLoading, router]);

  const handleProceedToPayment = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to proceed with payment.",
        variant: "destructive",
      });
      return;
    }
    if (cartItems.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before proceeding to payment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true); // Set pending state

    const xenditItems: XenditItem[] = cartItems.map(item => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price,
      // category: "Digital Goods" // Example, adjust as needed
    }));

    const description = cartItems.map(item => `${item.title} (x${item.quantity})`).join(', ');
    
    const result = await createXenditInvoice({
      items: xenditItems, // Pass structured items
      totalAmount: totalAmount, // Pass total amount explicitly
      description: `Flarebee Order: ${description}`, // Consolidated description
      currency: 'USD', 
      payerEmail: user?.email || undefined,
      userId: user?.uid || undefined,
    });

    setIsProcessingPayment(false); // Clear pending state

    if (result?.invoiceUrl) {
      // Cart clearing is now handled on the success page to be more robust
      router.push(result.invoiceUrl);
    } else {
      toast({
        title: "Payment Error",
        description: result?.error || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading your cart...</p>
      </div>
    );
  }

  // If user is not logged in and not loading, useEffect will redirect, but this is a fallback
  if (!user) {
    return (
       <div className="container mx-auto px-4 py-12 md:py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
         <Card className="shadow-lg text-center">
          <CardContent className="p-6">
            <LogIn className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-6">Please log in to access your cart.</p>
            <Button asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/templates">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Continue Shopping
        </Link>
      </Button>

      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-6">Your cart is empty.</p>
            <Button asChild>
              <Link href="/templates">Explore Templates</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <Card key={item.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 shadow-md">
                <div className="relative w-32 h-20 sm:w-40 sm:h-24 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                    data-ai-hint="template preview"
                  />
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-primary font-medium">${item.price.toFixed(2)}</p>
                  {/* <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p> */}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-xl sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes</span>
                  <span>Calculated at next step</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                </p>
                <Button 
                  size="lg" 
                  className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleProceedToPayment}
                  disabled={isProcessingPayment || cartItems.length === 0 || cartLoading}
                >
                  {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                  Proceed to Payment
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
