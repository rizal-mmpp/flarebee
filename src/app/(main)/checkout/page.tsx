
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
import { useEffect, useTransition } from 'react';
import { toast } from '@/hooks/use-toast';

interface XenditItem {
  name: string;
  quantity: number;
  price: number;
  category?: string; // Optional, as per Xendit docs
  // url?: string; // Optional
}

export default function CheckoutPage() {
  const { cartItems, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const totalAmount = getCartTotal();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Login Required",
        description: "Please log in to view your cart and proceed to checkout.",
        variant: "destructive",
      });
      router.replace('/'); // Redirect to homepage if not logged in
    }
  }, [user, authLoading, router]);

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

    startTransition(async () => {
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

      if (result?.invoiceUrl) {
        // Clear cart optimistically before redirecting, or do it in success page
        // clearCart(); // Consider implications if user closes Xendit page
        router.push(result.invoiceUrl);
      } else {
        toast({
          title: "Payment Error",
          description: result?.error || "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  // If user is not logged in, useEffect will redirect, but this is a fallback or initial render state
  if (!user) {
    return (
       <div className="container mx-auto px-4 py-12 md:py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        {/* Content for non-logged in users is minimal as redirect should occur */}
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
                  disabled={isPending || cartItems.length === 0}
                >
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
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
