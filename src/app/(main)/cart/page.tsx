
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Service, ServicePackage, CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Info, HelpCircle, ArrowRight, ShoppingCart, ServerCrash, CheckCircle, AlertCircle, X, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/firebase/AuthContext';

interface ServiceSelection {
  serviceSlug: string;
  packageId: string;
  billingCycle: 1 | 12 | 24 | 48;
  type: 'subscription' | 'fixed';
}

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function PublicCartPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selection, setSelection] = useState<ServiceSelection | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    const storedSelection = localStorage.getItem('serviceSelection');
    if (storedSelection) {
      try {
        const parsedSelection: any = JSON.parse(storedSelection);

        if (parsedSelection.billingCycle === 'annually') {
          parsedSelection.billingCycle = 12;
        } else if (parsedSelection.billingCycle === 'monthly') {
          parsedSelection.billingCycle = 1;
        } else if (typeof parsedSelection.billingCycle !== 'number' || ![1, 12, 24, 48].includes(parsedSelection.billingCycle)) {
            parsedSelection.billingCycle = 12;
        }

        setSelection(parsedSelection as ServiceSelection);

        const fetchServiceData = async () => {
          setIsLoading(true);
          const fetchedService = await getServiceBySlugFromFirestore(parsedSelection.serviceSlug);
          if (fetchedService) {
            setService(fetchedService);
            if (parsedSelection.type === 'subscription') {
              const pkg = fetchedService.pricing?.subscriptionDetails?.packages.find(p => p.id === parsedSelection.packageId);
              if (pkg) {
                setSelectedPackage(pkg);
              } else {
                setError("The selected package is no longer available.");
              }
            }
          } else {
            setError("The selected service could not be found.");
          }
          setIsLoading(false);
        };
        fetchServiceData();
      } catch (e) {
        setError("There was an issue loading your selection.");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const handleApplyCoupon = () => {
    if (couponCode.trim() === '') {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setCouponError(`The coupon code "${couponCode}" is not valid or has expired.`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading your selection...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Selection</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/services">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  if (!selection || !service) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
         <Card className="text-center w-full max-w-md">
          <CardHeader>
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <CardTitle>Your Cart is Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Select a service to get started.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/services">Explore Services</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const isSubscription = selection.type === 'subscription' && selectedPackage;
  const isFixedPrice = selection.type === 'fixed' && service.pricing?.fixedPriceDetails;

  const getDisplayPrice = () => {
    if (!isSubscription || !selectedPackage) return { monthly: 0, original: 0, saving: 0 };
    
    const annualEffectiveMonthlyPrice = selectedPackage.annualPriceCalcMethod === 'fixed'
        ? selectedPackage.discountedMonthlyPrice || selectedPackage.priceMonthly
        : selectedPackage.priceMonthly * (1 - (selectedPackage.annualDiscountPercentage || 0) / 100);

    let baseMonthlyPrice = selection.billingCycle > 1 ? annualEffectiveMonthlyPrice : selectedPackage.priceMonthly;
    if (selection.billingCycle === 24) baseMonthlyPrice *= (1 - 0.10);
    else if (selection.billingCycle === 48) baseMonthlyPrice *= (1 - 0.20);

    const regularMonthlyPrice = selectedPackage.originalPriceMonthly || selectedPackage.priceMonthly;
    const totalSaving = (regularMonthlyPrice * selection.billingCycle) - (baseMonthlyPrice * selection.billingCycle);

    return { monthly: baseMonthlyPrice, original: regularMonthlyPrice, saving: totalSaving };
  };
  
  const { monthly: monthlyPrice, original: originalPrice, saving } = getDisplayPrice();
  const subtotal = isFixedPrice ? service.pricing?.fixedPriceDetails?.price || 0 : monthlyPrice * selection.billingCycle;
  const renewalText = `Renews at ${formatIDR(originalPrice)}/mo. Cancel anytime.`;

  const handleProceedToCheckout = () => {
     if (!selection || !service) {
      toast({ title: "Selection Error", description: "Your service selection is missing. Please go back and choose a service plan.", variant: "destructive" });
      return;
    }

    let cartItemId: string;
    let cartItemTitle: string;
    
    if (isFixedPrice) {
      cartItemId = `${service.slug}:fixed-price`;
      cartItemTitle = `${service.title} (One-Time Project)`;
    } else if (selectedPackage) {
      cartItemId = `${service.slug}:${selectedPackage.id}:${selection.billingCycle}`;
      cartItemTitle = `${service.title} (${selectedPackage.name} - ${selection.billingCycle} months)`;
    } else {
       toast({ title: "Selection Error", description: "The selected package is invalid.", variant: "destructive" });
       return;
    }

    const cartItem: CartItem = { id: cartItemId, title: cartItemTitle, price: subtotal, imageUrl: service.imageUrl, quantity: 1 };
    
    addToCart(cartItem);

    const redirectUrl = encodeURIComponent('/dashboard/checkout');
    router.push(`/auth/login?redirect=${redirectUrl}`);
  };

  return (
    <div className="relative isolate overflow-hidden bg-muted/20 flex-grow py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <Button variant="outline" asChild className="mb-8 group">
          <Link href={`/services/${service.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Service
          </Link>
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Review Your Selection</h1>
        <p className="text-lg text-muted-foreground mb-8">Confirm your choice and proceed to create an account or sign in.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-start">
          <div className="lg:col-span-2 space-y-4">
            {isSubscription && selectedPackage && (
              <Card className="shadow-lg border-border/60">
                <CardHeader>
                    <CardTitle className="text-xl">{service.title} ({selectedPackage.name})</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="p-6 space-y-6">
                    {saving > 0 && (
                        <div className="flex items-center p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                            <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-medium text-foreground">You're saving {formatIDR(saving)} with this plan.</p>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <Label htmlFor="duration">Duration</Label>
                            <Select value={String(selection.billingCycle)} onValueChange={(value) => setSelection({...selection, billingCycle: Number(value) as 1 | 12 | 24 | 48})}>
                                <SelectTrigger id="duration" className="w-full sm:w-[220px] mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Month</SelectItem>
                                    <SelectItem value="12">12 Months</SelectItem>
                                    <SelectItem value="24">24 Months (Save 10%)</SelectItem>
                                    <SelectItem value="48">48 Months (Save 20%)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">{renewalText}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="flex items-baseline justify-end gap-1">
                                <p className="text-4xl font-bold text-foreground">{formatIDR(monthlyPrice)}</p>
                                <span className="text-lg font-normal text-muted-foreground">/mo</span>
                            </div>
                            {originalPrice > monthlyPrice && <p className="text-base text-muted-foreground line-through">{formatIDR(originalPrice)}/mo</p>}
                        </div>
                    </div>
                </CardContent>
              </Card>
            )}
            {isFixedPrice && service.pricing?.fixedPriceDetails && (
              <Card className="shadow-lg border-border/60">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg">{service.title} ({service.pricing.fixedPriceDetails.title || 'One-Time Project'})</h4>
                  <p className="text-3xl font-bold text-foreground mt-2">{formatIDR(service.pricing.fixedPriceDetails.price)}</p>
                  <p className="text-sm text-muted-foreground mt-1">One-time payment for a defined scope of work.</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-border/60 bg-card/95 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-xl">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{service.title} ({isFixedPrice ? 'Fixed Price' : selectedPackage?.name})</span>
                  <span className="font-medium text-foreground">{isFixedPrice ? formatIDR(subtotal) : `${formatIDR(monthlyPrice)} x ${selection.billingCycle}`}</span>
                </div>
                <Separator className="my-3"/>
                <div className="flex justify-between font-bold text-lg text-foreground"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
                <p className="text-xs text-muted-foreground text-center pt-2">Taxes calculated at checkout.</p>
              </CardContent>
              <CardFooter>
                 <Button className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" onClick={handleProceedToCheckout}>
                    <User className="mr-2 h-4 w-4" />
                    Sign In & Continue
                    <ArrowRight className="ml-auto h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
