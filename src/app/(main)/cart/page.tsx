
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Service, ServicePackage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Info, HelpCircle, ArrowRight, ShoppingCart, ServerCrash } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ServiceSelection {
  serviceSlug: string;
  packageId: string;
  billingCycle: 'monthly' | 'annually' | 'one-time';
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

export default function CartPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<ServiceSelection | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedSelection = localStorage.getItem('serviceSelection');
    if (storedSelection) {
      try {
        const parsedSelection: ServiceSelection = JSON.parse(storedSelection);
        setSelection(parsedSelection);

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
        console.error("Failed to parse service selection from localStorage", e);
        setError("There was an issue loading your selection.");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);
  
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
            <p className="text-muted-foreground">You haven't selected any services yet.</p>
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
    const isAnnual = selection.billingCycle === 'annually';
    let displayPrice: number;
    let originalDisplayPrice: number | undefined = undefined;

    if (isAnnual) {
      if (selectedPackage.annualPriceCalcMethod === 'percentage') {
        const annualPrice = selectedPackage.priceMonthly * 12 * (1 - ((selectedPackage.annualDiscountPercentage || 0) / 100));
        displayPrice = annualPrice / 12;
      } else {
        displayPrice = selectedPackage.discountedMonthlyPrice || 0;
      }
      originalDisplayPrice = selectedPackage.priceMonthly;
    } else {
      displayPrice = selectedPackage.priceMonthly;
      originalDisplayPrice = selectedPackage.originalPriceMonthly;
    }

    const saving = originalDisplayPrice && originalDisplayPrice > displayPrice ? (originalDisplayPrice - displayPrice) * 12 : 0;
    
    return { monthly: displayPrice, original: originalDisplayPrice, saving };
  };
  
  const { monthly: monthlyPrice, original: originalPrice, saving } = getDisplayPrice();
  const subtotal = isFixedPrice ? service.pricing?.fixedPriceDetails?.price || 0 : monthlyPrice * (selection.billingCycle === 'annually' ? 12 : 1);


  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      ></div>
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <Button variant="outline" asChild className="mb-8 group">
          <Link href={`/services/${service.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Service
          </Link>
        </Button>
        
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Review Your Cart</h1>
        <p className="text-lg text-muted-foreground mb-8">Confirm your service selection and proceed to checkout.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{service.title}</h2>
            {isSubscription && selectedPackage && (
              <Card className="shadow-lg border-border/60">
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-end gap-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="duration">Billing Duration</Label>
                                <Select defaultValue={selection.billingCycle} onValueChange={(value) => setSelection({...selection, billingCycle: value as 'monthly' | 'annually'})}>
                                    <SelectTrigger id="duration" className="w-full sm:w-[180px] mt-1">
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="annually">Annually</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {selection.billingCycle === 'annually' && saving > 0 && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white font-semibold">SAVE {formatIDR(saving)}</Badge>
                            )}
                        </div>
                        <div className="text-right flex-shrink-0">
                            {originalPrice && originalPrice > monthlyPrice && (
                                <p className="text-lg text-muted-foreground line-through">{formatIDR(originalPrice)}/mo</p>
                            )}
                            <p className="text-4xl font-bold text-foreground">{formatIDR(monthlyPrice)}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                        </div>
                    </div>
                  
                    <div className="p-4 bg-amber-100/60 dark:bg-amber-900/20 rounded-xl text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p>Congratulations! You get a FREE domain and 3 months FREE with this package.</p>
                    </div>
                </CardContent>
              </Card>
            )}
            {isFixedPrice && service.pricing?.fixedPriceDetails && (
              <Card className="shadow-lg border-border/60">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg">{service.pricing.fixedPriceDetails.title || 'One-Time Project'}</h4>
                  <p className="text-3xl font-bold text-foreground mt-2">{formatIDR(service.pricing.fixedPriceDetails.price)}</p>
                  <p className="text-sm text-muted-foreground mt-1">One-time payment for a defined scope.</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-border/60 bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{service.title} ({isFixedPrice ? 'Fixed Price' : selectedPackage?.name})</span>
                  <span className="font-medium text-foreground">{isFixedPrice ? formatIDR(subtotal) : `${formatIDR(monthlyPrice)} x ${selection.billingCycle === 'annually' ? '12' : '1'}`}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-muted-foreground flex items-center gap-1.5">Domain Name <HelpCircle className="h-3.5 w-3.5" /></span>
                   <span className="text-green-600 font-medium">Free</span>
                </div>
                 <div className="flex justify-between items-center">
                   <span className="text-muted-foreground flex items-center gap-1.5">Privacy Protection <HelpCircle className="h-3.5 w-3.5" /></span>
                   <span className="text-green-600 font-medium">Free</span>
                </div>
                <Separator className="my-3"/>
                <div className="flex justify-between font-bold text-lg text-foreground">
                  <span>Subtotal</span>
                  <span>{formatIDR(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">Taxes and final total will be calculated at checkout.</p>
                <div className="pt-2">
                    <Label htmlFor="coupon" className="text-xs font-medium">Have a coupon code?</Label>
                    <div className="flex gap-2 mt-1">
                        <Input id="coupon" placeholder="Enter code" className="h-9"/>
                        <Button variant="secondary" className="h-9 text-secondary-foreground">Apply</Button>
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                 <Button className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                    Continue to Checkout <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
