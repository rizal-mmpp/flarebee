
'use client'; 

import { use, useEffect, useState } from 'react';
import type { Service, ServicePackage } from '@/lib/types';
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import { notFound, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ServerCrash, Check, HelpCircle, Bot, Loader2, Send, MessageSquare, DollarSign, Repeat, Calendar, Sparkles } from 'lucide-react'; 
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Switch } from '@/components/ui/switch';


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


const SubscriptionPackageCard: React.FC<{
  pkg: ServicePackage;
  billingCycle: 'monthly' | 'annually';
  annualDiscountPercentage?: number;
}> = ({ pkg, billingCycle, annualDiscountPercentage }) => {
  const price = billingCycle === 'monthly' ? pkg.priceMonthly : pkg.priceAnnually;
  const periodText = billingCycle === 'monthly' ? '/month' : '/year';
  
  return (
    <Card key={pkg.name} className={cn('flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative', pkg.isPopular ? 'border-primary border-2 shadow-xl' : 'shadow-lg')}>
      {pkg.isPopular && (
        <Badge variant="default" className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs px-4 py-1.5">
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center pt-10">
        <CardTitle className="text-2xl">{pkg.name}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6">
        <div className="text-center">
            <p className="text-4xl font-bold text-foreground">{formatIDR(price)}<span className="text-base font-normal text-muted-foreground ml-1">{periodText}</span></p>
             {billingCycle === 'annually' && annualDiscountPercentage && (
                <p className="text-xs text-green-600 font-semibold mt-1">Includes {annualDiscountPercentage}% discount!</p>
            )}
        </div>
        <ul className="space-y-3 text-foreground/90">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button size="lg" className={cn('w-full', pkg.isPopular ? '' : 'bg-primary/90 hover:bg-primary')} variant={pkg.isPopular ? 'default' : 'secondary'}>
          {pkg.cta || 'Get Started'}
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function ServiceDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const slug = params.id;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  useEffect(() => {
    async function fetchService() {
      if (!slug) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedService = await getServiceBySlugFromFirestore(slug);
        if (!fetchedService || fetchedService.status !== 'active') {
          notFound();
          return;
        }
        setService(fetchedService);
      } catch (err) {
        console.error("Failed to fetch service:", err);
        setError("Could not load service details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchService();
  }, [slug]);

  const handleCustomQuoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 1500));
    alert('Thank you! Your custom inquiry has been submitted. We will get back to you shortly.');
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
         <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Service</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/services">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  if (!service) {
    return notFound(); 
  }
  
  const hasActivePricing = service.pricing?.isFixedPriceActive || service.pricing?.isSubscriptionActive || service.pricing?.isCustomQuoteActive;


  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card border-b relative overflow-hidden">
           <div aria-hidden="true" className="absolute inset-0 -z-0 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center relative z-10">
              <div className="space-y-4">
                  <Badge variant="secondary">{service.category.name}</Badge>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight">{service.title}</h1>
                  <p className="text-lg text-muted-foreground">{service.shortDescription}</p>
                  <div className="flex gap-4 pt-4">
                      {hasActivePricing && (
                          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                              <a href="#pricing">View Pricing</a>
                          </Button>
                      )}
                      <Button size="lg" variant="outline" asChild>
                          <Link href="/contact-us">Contact Us</Link>
                      </Button>
                  </div>
              </div>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                  <Image src={service.imageUrl} alt={service.title} fill style={{objectFit:"fill"}} data-ai-hint={service.dataAiHint || "service visual"}/>
              </div>
          </div>
      </section>
      
      {/* Dynamic Pricing Section */}
      {hasActivePricing && (
         <section id="pricing" className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Find the Perfect Plan</h2>
                    <p className="text-muted-foreground mt-2">Choose the option that best fits your needs. All plans are flexible and can be customized.</p>
                </div>
                
                {service.pricing?.isSubscriptionActive && service.pricing.subscriptionDetails && service.pricing.subscriptionDetails.packages.length > 0 && (
                    <div className="mb-12">
                        <div className="flex justify-center items-center gap-4 mb-8">
                            <span className={cn('font-medium', billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground')}>Monthly</span>
                            <Switch checked={billingCycle === 'annually'} onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')} aria-label="Toggle billing cycle"/>
                            <span className={cn('font-medium', billingCycle === 'annually' ? 'text-primary' : 'text-muted-foreground')}>
                                Annually
                                {service.pricing.subscriptionDetails.annualDiscountPercentage && (
                                    <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-700 border-none">Save {service.pricing.subscriptionDetails.annualDiscountPercentage}%</Badge>
                                )}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            {service.pricing.subscriptionDetails.packages.map(pkg => (
                               <SubscriptionPackageCard key={pkg.name} pkg={pkg} billingCycle={billingCycle} annualDiscountPercentage={service.pricing?.subscriptionDetails?.annualDiscountPercentage} />
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    {service.pricing?.isFixedPriceActive && service.pricing.fixedPriceDetails && (
                        <Card className="flex flex-col justify-between">
                            <CardHeader><CardTitle className="flex items-center"><DollarSign className="mr-2 h-6 w-6 text-primary"/>One-Time Project</CardTitle><CardDescription>A single payment for a defined scope of work.</CardDescription></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{formatIDR(service.pricing.fixedPriceDetails.price)}</p></CardContent>
                            <CardFooter><Button className="w-full">Get Started</Button></CardFooter>
                        </Card>
                    )}
                    {service.pricing?.isCustomQuoteActive && (
                        <Card className="flex flex-col justify-between">
                             <CardHeader><CardTitle className="flex items-center"><Sparkles className="mr-2 h-6 w-6 text-primary"/>Custom Project</CardTitle><CardDescription>Need something different? Let's build a custom plan together.</CardDescription></CardHeader>
                            <CardContent><p className="text-muted-foreground">{service.pricing.customQuoteDetails?.formDescription || "Tell us about your project, and we'll craft a custom package tailored just for you. No obligations, just possibilities."}</p></CardContent>
                            <CardFooter><Button asChild variant="outline" className="w-full"><Link href="/contact-us">Request a Quote</Link></Button></CardFooter>
                        </Card>
                    )}
                </div>
            </div>
         </section>
      )}


      {/* Custom Quote Section */}
      {service.pricing?.isCustomQuoteActive && service.pricing.customQuoteDetails && (
        <section id="custom-quote-form" className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">{service.pricing.customQuoteDetails.title || "Still not sure?"}</h2>
                <p className="text-muted-foreground text-lg">{service.pricing.customQuoteDetails.text || "Tell us about your project, and we'll craft a custom package tailored just for you. No obligations, just possibilities."}</p>
                {service.pricing.customQuoteDetails.infoBoxText && (
                  <div className="flex items-start p-4 bg-primary/10 rounded-2xl">
                    <Bot className="h-8 w-8 text-primary mr-4 mt-1 flex-shrink-0"/>
                    <p className="text-sm text-primary/80">{service.pricing.customQuoteDetails.infoBoxText}</p>
                  </div>
                )}
              </div>
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle>{service.pricing.customQuoteDetails.formTitle || "Describe Your Project"}</CardTitle>
                      <CardDescription>{service.pricing.customQuoteDetails.formDescription || "The more details you provide, the better we can assist you."}</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleCustomQuoteSubmit}>
                      <CardContent className="space-y-4">
                          <div><Label htmlFor="businessType">Type of Business</Label><Input id="businessType" placeholder="e.g., Cafe, Online Store, Consultant" required /></div>
                          <div><Label htmlFor="budget">Estimated Budget (IDR)</Label><Input id="budget" placeholder="e.g., 2,000,000" type="text" required /></div>
                          <div><Label htmlFor="needs">Project Needs & Features</Label><Textarea id="needs" rows={4} placeholder="Describe the features you need, like a booking system, photo gallery, blog, etc." required/></div>
                      </CardContent>
                      <CardFooter>
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                             Submit Inquiry
                          </Button>
                      </CardFooter>
                  </form>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {service.showFaqSection && service.faq && service.faq.length > 0 && (
        <section id="faq" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {service.faq.map((item, i) => (
                  <AccordionItem key={item.id || `faq-${i}`} value={`item-${i}`}>
                      <AccordionTrigger className="text-lg text-left hover:no-underline"><HelpCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0"/>{item.q}</AccordionTrigger>
                      <AccordionContent className="text-base text-foreground/90 pl-10">
                          {item.a}
                      </AccordionContent>
                  </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}
      
      {/* New Contact CTA Section */}
      <section id="contact-cta" className="py-16 md:py-24 border-t">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Our team is ready to provide you with a personalized consultation to ensure our service perfectly fits your vision.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-7">
              <Link href="/contact-us">
                Contact Our Experts
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}

