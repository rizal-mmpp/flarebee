
'use server';

import type { Service } from '@/lib/types';
import { getPublicServiceBySlug } from '@/lib/actions/erpnext/item.actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ServerCrash, MessageSquare, Check, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';
import { ServicePurchaseClientWrapper } from '@/app/(main)/services/[id]/ServicePurchaseClientWrapper';

export default async function DashboardServiceDetailPage({ params }: { params: { id: string } }) {
  const slug = params.id;
  const result = await getPublicServiceBySlug(slug);

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
          <Link href="/dashboard/browse-services">
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
      <div className="bg-background text-foreground">
        <div className="container mx-auto px-4 md:px-6 py-8">
           <Button variant="outline" asChild className="group">
            <Link href="/dashboard/browse-services">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Back to Services
            </Link>
            </Button>
        </div>
        {/* Hero Section */}
        <section className="pt-8 pb-16 md:pt-12 md:pb-24 bg-card border-y relative overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-0 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-4">
              <Badge variant="secondary">{service.category.name}</Badge>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">{service.title}</h1>
              <p className="text-lg text-muted-foreground">{service.shortDescription}</p>
              <div className="flex gap-4 pt-4">
                {hasActivePricing && <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground"><a href="#pricing">View Pricing</a></Button>}
                <Button size="lg" variant="outline" asChild><Link href="/contact-us">Contact Us</Link></Button>
              </div>
            </div>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
              <Image src={service.imageUrl} alt={service.title} fill style={{objectFit:"fill"}} data-ai-hint={service.dataAiHint || "service visual"}/>
            </div>
          </div>
        </section>

        {/* Dynamic sections are now handled by the client wrapper */}
        {service.pricing?.isSubscriptionActive && <section id="pricing" className="py-16 md:py-24 border-t" />}
        {service.pricing?.isFixedPriceActive && <section id="one-time-project" className="py-16 md:py-24 border-t" />}
        {service.pricing?.isCustomQuoteActive && <section id="custom-quote-form" className="py-16 md:py-24 border-t" />}
        
        {service.longDescription && (
            <section className="py-16 md:py-24 border-t">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                     <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80">
                        <ReactMarkdown>{service.longDescription}</ReactMarkdown>
                    </article>
                </div>
            </section>
        )}

        {service.showFaqSection && service.faq && service.faq.length > 0 && (
          <section id="faq" className="py-16 md:py-24 bg-background border-t">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
              <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2></div>
              <Accordion type="single" collapsible className="w-full">
                {service.faq.map((item, i) => (
                  <AccordionItem key={item.id || `faq-${i}`} value={`item-${i}`}>
                    <AccordionTrigger className="text-lg text-left hover:no-underline"><HelpCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0"/>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-base text-foreground/90 pl-10">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        <section id="contact-cta" className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-primary mb-4" /><h2 className="text-3xl font-bold text-foreground mb-4">Still Have Questions?</h2>
              <p className="text-muted-foreground mb-8 text-lg">Our team is ready to provide you with a personalized consultation to ensure our service perfectly fits your vision.</p>
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-7"><Link href="/contact-us">Contact Our Experts</Link></Button>
            </div>
          </div>
        </section>
      </div>
    </ServicePurchaseClientWrapper>
  );
}
