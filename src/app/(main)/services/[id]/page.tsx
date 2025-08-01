
'use server'; 

import type { Service, ServicePackage } from '@/lib/types';
import { getPublicServiceBySlug } from '@/lib/actions/erpnext/item.actions';
import { notFound } from 'next/navigation'; 
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ServerCrash, Check, HelpCircle, Bot, Loader2, Send, MessageSquare, DollarSign, Repeat, Calendar, Sparkles, Package, X } from 'lucide-react'; 
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ServicePurchaseClientWrapper } from './ServicePurchaseClientWrapper';

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

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const slug = params.id;
  const result = await getPublicServiceBySlug({ slug });

  if (!result.success || !result.data) {
    if (result.error?.includes('not found')) {
      notFound();
    }
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
         <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Service</h2>
        <p className="text-muted-foreground mb-6">{result.error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/services">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  const service = result.data;
  const hasActivePricing = service.pricing?.isFixedPriceActive || service.pricing?.isSubscriptionActive || service.pricing?.isCustomQuoteActive;

  return (
    <ServicePurchaseClientWrapper service={service}>
        {({ subscriptionPackages, fixedPriceSection, customQuoteSection }) => (
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

                {/* Subscription Plans Section */}
                {service.pricing?.isSubscriptionActive && service.pricing.subscriptionDetails && service.pricing.subscriptionDetails.packages.length > 0 && (
                <section id="pricing" className={cn("py-16 md:py-24 border-t", service.pricing?.subscriptionDetails?.bgClassName)}>
                    <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Flexible Plans</h2>
                        <p className="text-muted-foreground mt-2">Choose the subscription that best fits your needs. Configure your term in the cart.</p>
                    </div>
                    {subscriptionPackages}
                    </div>
                </section>
                )}

                {/* One-Time Project Section */}
                {service.pricing?.isFixedPriceActive && service.pricing.fixedPriceDetails && (
                <section id="one-time-project" className={cn("py-16 md:py-24 border-t", service.pricing?.fixedPriceDetails?.bgClassName)}>
                    {fixedPriceSection}
                </section>
                )}

                {/* Custom Quote Section */}
                {service.pricing?.isCustomQuoteActive && service.pricing.customQuoteDetails && (
                <section id="custom-quote-form" className={cn("py-16 md:py-24 border-t", service.pricing?.customQuoteDetails?.bgClassName)}>
                    {customQuoteSection}
                </section>
                )}

                {/* FAQ Section */}
                {service.showFaqSection && service.faq && service.faq.length > 0 && (
                <section id="faq" className="py-16 md:py-24 bg-background border-t">
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
        )}
    </ServicePurchaseClientWrapper>
  );
}
