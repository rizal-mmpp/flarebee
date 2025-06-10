
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
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface XenditItem {
  name: string;
  quantity: number;
  price: number;
  category?: string; 
}

export default function CheckoutPage() {
  const { cartItems, removeFromCart, getCartTotal, clearCart, cartLoading } = useCart();
  const { user, loading: authLoading } = useAuth(); 
  const router = useRouter();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const totalAmount = getCartTotal();

  useEffect(() => {
    if (!authLoading && !user && !cartLoading) { 
      toast({
        title: "Login Required",
        description: "Please log in to view your cart and proceed to checkout.",
        variant: "destructive",
      });
      router.replace('/'); 
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

    setIsProcessingPayment(true);

    const xenditItems: XenditItem[] = cartItems.map(item => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price,
    }));

    const description = cartItems.map(item => `${item.title} (x${item.quantity})`).join(', ');
    
    try {
      // The server action createXenditInvoice will attempt to handle the redirect.
      // If it encounters an error before redirecting, it should return a plain object { error: "message" }.
      const result = await createXenditInvoice({
        items: xenditItems,
        totalAmount: totalAmount,
        description: `Flarebee Order: ${description}`,
        currency: 'USD', 
        payerEmail: user?.email || undefined,
        userId: user?.uid || undefined,
      });

      // Check if the server action returned an error object instead of redirecting
      if (result && 'error' in result && typeof result.error === 'string') {
        toast({
          title: "Payment Processing Failed",
          description: result.error,
          variant: "destructive",
        });
        // setIsProcessingPayment(false) will be handled by the finally block.
        return; // Exit if an error object was explicitly returned.
      }
      
      // If a redirect was supposed to happen server-side and we are still here,
      // it's an unexpected state for the dummy/current logic.
      // The browser should have been redirected by the server action.
      // For a real payment gateway, this might be where you handle a response that isn't a redirect.

    } catch (error: any) { // This catch block handles errors THROWN by the server action or network issues.
      console.error("Error during payment processing (thrown):", error);
      let errorMessage = "An unexpected error occurred. Please try again or contact support.";
      if (error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      // No need to check for error.error here as this is for thrown errors.
      toast({
        title: "Payment Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // This ensures the processing state is reset, even if the page is about to navigate away
      // or if an error occurred.
      setIsProcessingPayment(false);
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
                    fill
                    objectFit="cover"
                    className="rounded-md"
                    data-ai-hint="template preview"
                  />
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-primary font-medium">${item.price.toFixed(2)}</p>
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
