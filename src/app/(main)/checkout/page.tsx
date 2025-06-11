
'use client';

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, CreditCard, ShoppingBag, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { createXenditInvoice } from '@/lib/actions/xendit.actions';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { CartItem } from '@/lib/types';

interface XenditFormattedItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  url?: string;
}

export default function CheckoutPage() {
  const { cartItems, removeFromCart, getCartTotal, cartLoading } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const totalAmount = getCartTotal(); // Assuming prices are already in IDR

  // Helper to format IDR currency
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

    const xenditItems: XenditFormattedItem[] = cartItems.map(item => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price, // Price per unit in IDR
      category: 'Digital Goods', // Example category
      url: `${window.location.origin}/templates/${item.id}`, // Example URL
    }));

    const description = cartItems.map(item => `${item.title} (x${item.quantity})`).join(', ');

    try {
      const result = await createXenditInvoice({
        cartItemsForOrder: cartItems,
        xenditFormattedItems: xenditItems,
        totalAmount: totalAmount,
        description: `Flarebee Order: ${description}`,
        currency: 'IDR',
        payerEmail: user?.email || undefined,
        userId: user?.uid,
      });
      
      if (result && 'error' in result && typeof result.error === 'string') {
        toast({
          title: "Payment Processing Failed",
          description: result.error,
          variant: "destructive",
        });
      }
      // If successful, createXenditInvoice will redirect, so no further client-side action needed here.
    } catch (error: any) {
      if (error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        // This is a redirect signal from the server action. Next.js will handle it.
        // No toast needed here.
      } else {
        console.error("Error during payment processing (thrown by createXenditInvoice or other):", error);
        let errorMessage = "An unexpected error occurred. Please try again or contact support.";
        if (error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        toast({
          title: "Payment Processing Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
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
                    sizes="(max-width: 640px) 128px, 160px"
                    style={{objectFit:"cover"}}
                    className="rounded-md"
                    data-ai-hint="template preview"
                  />
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-primary font-medium">{formatIDR(item.price)}</p>
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
                  <span>{formatIDR(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes</span>
                  <span>Calculated at next step</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>{formatIDR(totalAmount)}</span>
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
