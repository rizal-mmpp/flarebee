
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Service, ServicePackage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Check, X, Package, Bot, Loader2, Send } from 'lucide-react';

const formatIDR = (amount: number | string | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g,"")) : amount;
  if (isNaN(numericAmount)) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

const SubscriptionPackageCard: React.FC<{ pkg: ServicePackage; onSelect: () => void; }> = ({ pkg, onSelect }) => {
  const annualEffectiveMonthlyPrice = pkg.annualPriceCalcMethod === 'fixed'
    ? pkg.discountedMonthlyPrice || pkg.priceMonthly
    : pkg.priceMonthly * (1 - (pkg.annualDiscountPercentage || 0) / 100);

  const displayPrice = annualEffectiveMonthlyPrice;
  const originalDisplayPrice = pkg.originalPriceMonthly || pkg.priceMonthly;

  const discountPercentage = (originalDisplayPrice && displayPrice > 0 && originalDisplayPrice > displayPrice)
    ? Math.round(((originalDisplayPrice - displayPrice) / originalDisplayPrice) * 100)
    : 0;

  return (
    <Card className={cn('flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative border-2', pkg.isPopular ? 'border-primary shadow-xl' : 'shadow-lg border-transparent')}>
      {pkg.isPopular && <Badge variant="default" className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs px-4 py-1.5">Most Popular</Badge>}
      <CardHeader className="text-left pt-10 px-6"><CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle><CardDescription>{pkg.description}</CardDescription></CardHeader>
      <CardContent className="flex-grow space-y-4 px-6">
        <div className="text-left">
           {originalDisplayPrice && originalDisplayPrice > displayPrice && (<div className='flex items-center gap-3'><p className="text-lg text-muted-foreground line-through">{formatIDR(originalDisplayPrice)}</p>{discountPercentage > 0 && <Badge variant="secondary" className="bg-destructive/10 text-destructive border-none">DISKON {discountPercentage}%</Badge>}</div>)}
            <p className="text-4xl font-bold text-foreground">{formatIDR(displayPrice)}<span className="text-base font-normal text-muted-foreground ml-1">/mo</span></p>
            {pkg.renewalInfo && <p className="text-xs text-muted-foreground mt-2">{pkg.renewalInfo}</p>}
        </div>
        <Button size="lg" className={cn('w-full', pkg.isPopular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : '')} variant={pkg.isPopular ? 'default' : 'outline'} onClick={onSelect}>{pkg.cta || 'Choose Plan'}</Button>
        <div className="pt-4 border-t border-border">
          <ul className="space-y-3 text-foreground/90">
            {pkg.features.map((feature, index) => (<li key={feature.id || index} className="flex items-start gap-3">{feature.isIncluded ? <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" /> : <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />}<span className={cn(!feature.isIncluded && "text-muted-foreground")}>{feature.text}</span></li>))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

interface RenderProps {
    subscriptionPackages: React.ReactNode;
    fixedPriceSection: React.ReactNode;
    customQuoteSection: React.ReactNode;
}

export function ServicePurchaseClientWrapper({ service, children }: { service: Service; children: (props: RenderProps) => React.ReactNode }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectSubscription = (pkg: ServicePackage) => {
    const selection = { serviceSlug: service.slug, packageId: pkg.id, billingCycle: 12, type: 'subscription' };
    localStorage.setItem('serviceSelection', JSON.stringify(selection));
    router.push('/cart');
  };

  const handleSelectFixedPrice = () => {
    const selection = { serviceSlug: service.slug, packageId: 'fixed_price', billingCycle: 1, type: 'fixed' };
    localStorage.setItem('serviceSelection', JSON.stringify(selection));
    router.push('/cart');
  };

  const handleCustomQuoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 1500));
    alert('Thank you! Your custom inquiry has been submitted. We will get back to you shortly.');
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };
  
  const renderProps: RenderProps = {
    subscriptionPackages: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
        {service.pricing?.subscriptionDetails?.packages.map(pkg => <SubscriptionPackageCard key={pkg.id} pkg={pkg} onSelect={() => handleSelectSubscription(pkg)} />)}
      </div>
    ),
    fixedPriceSection: (
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4"><Package className="mr-2 h-5 w-5" /> One-Time Project</div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{service.pricing?.fixedPriceDetails?.title || 'Complete Project Delivery'}</h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{service.pricing?.fixedPriceDetails?.description || 'Get a complete, one-and-done solution with a single upfront payment.'}</p>
            <div className="space-y-4">
              <p className="text-4xl font-extrabold text-foreground">{formatIDR(service.pricing?.fixedPriceDetails?.price)}</p>
              <Button size="lg" className="w-full sm:w-auto" onClick={handleSelectFixedPrice}>Get Started with this Project</Button>
            </div>
          </div>
          <div className="order-1 md:order-2">
            {service.pricing?.fixedPriceDetails?.imageUrl ? (<div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl"><Image src={service.pricing.fixedPriceDetails.imageUrl} alt={service.pricing.fixedPriceDetails.title || 'One-time project image'} fill style={{ objectFit: "cover" }} className="transition-transform duration-300 ease-in-out group-hover:scale-105" data-ai-hint={service.pricing.fixedPriceDetails.imageAiHint || "project abstract"}/></div>
            ) : (<div className="relative w-full aspect-video rounded-2xl bg-muted flex items-center justify-center"><Package className="h-24 w-24 text-muted-foreground/30" /></div>)}
          </div>
        </div>
      </div>
    ),
    customQuoteSection: (
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">{service.pricing?.customQuoteDetails?.title || "Need a Custom Solution?"}</h2>
            <p className="text-muted-foreground text-lg">{service.pricing?.customQuoteDetails?.text || "Every great project has unique needs. Tell us about yours, and we'll craft a personalized quote and plan to bring your vision to life."}</p>
            {service.pricing?.customQuoteDetails?.infoBoxText && (<div className="flex items-start p-4 bg-primary/10 rounded-2xl"><Bot className="h-8 w-8 text-primary mr-4 mt-1 flex-shrink-0"/><p className="text-sm text-primary/80">{service.pricing.customQuoteDetails.infoBoxText}</p></div>)}
          </div>
          <Card className="shadow-lg">
              <CardHeader><CardTitle>{service.pricing?.customQuoteDetails?.formTitle || "Describe Your Project"}</CardTitle><CardDescription>{service.pricing?.customQuoteDetails?.formDescription || "The more details you provide, the better we can assist you."}</CardDescription></CardHeader>
              <form onSubmit={handleCustomQuoteSubmit}>
                  <CardContent className="space-y-4">
                      <div><Label htmlFor="businessType">Type of Business</Label><Input id="businessType" placeholder="e.g., Cafe, Online Store, Consultant" required /></div>
                      <div><Label htmlFor="budget">Estimated Budget (IDR)</Label><Input id="budget" placeholder="e.g., 2,000,000" type="text" required /></div>
                      <div><Label htmlFor="needs">Project Needs & Features</Label><Textarea id="needs" rows={4} placeholder="Describe the features you need, like a booking system, photo gallery, blog, etc." required/></div>
                  </CardContent>
                  <CardFooter><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}Submit Inquiry</Button></CardFooter>
              </form>
          </Card>
        </div>
      </div>
    )
  };
  
  return <>{children(renderProps)}</>;
}
