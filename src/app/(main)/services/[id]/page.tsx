'use client'; 

import { use, useEffect, useState } from 'react';
import type { Service } from '@/lib/types';
import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import { notFound, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ServerCrash, Check, FileText, HelpCircle, Bot, Loader2, Send } from 'lucide-react'; 
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Hardcoded example data, in a real app this might come from the service object
const examplePackages = [
    {
        name: 'Basic',
        price: '500.000',
        priceUnit: 'IDR',
        description: 'Perfect for getting started with a professional online presence.',
        features: ['Up to 5 Pages', 'Standard Design', 'Mobile Responsive', 'Basic SEO', '1 Month Support'],
        cta: 'Get Started'
    },
    {
        name: 'Pro',
        price: '1.500.000',
        priceUnit: 'IDR',
        isPopular: true,
        description: 'Ideal for growing businesses needing more features and customization.',
        features: ['Up to 15 Pages', 'Custom Design', 'CMS Integration', 'Advanced SEO', '3 Months Support', 'Blog Setup'],
        cta: 'Choose Pro'
    },
    {
        name: 'Business',
        price: '4.500.000',
        priceUnit: 'IDR',
        description: 'Comprehensive solution for established businesses with high-traffic needs.',
        features: ['Unlimited Pages', 'Premium Design', 'E-commerce Ready', 'Priority Support', 'Automation Setup', 'Analytics Dashboard'],
        cta: 'Go Business'
    }
]

const exampleFaq = [
    {
        q: "What is included in the '1 Month Support'?",
        a: "Our support includes fixing any bugs or issues that arise from the original code, guidance on using your website's features, and minor content updates (e.g., changing text or an image)."
    },
    {
        q: "Can I upgrade my package later?",
        a: "Absolutely! You can upgrade your package at any time. You'll only pay the difference, and we'll work with you to integrate the new features seamlessly."
    },
    {
        q: "What does 'E-commerce Ready' mean?",
        a: "It means the website is built with the foundational architecture to support an online store. We can integrate payment gateways, product management, and cart functionality. The full e-commerce setup might be an add-on depending on the complexity."
    },
    {
        q: "Do you provide the domain and hosting?",
        a: "Our packages typically include basic hosting and a subdomain (e.g., yourbusiness.rio.com). We can help you register and connect a custom domain, and we offer managed hosting plans for better performance and security."
    }
]

export default function ServiceDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const id = params.id;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchService() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedService = await getServiceByIdFromFirestore(id);
        if (!fetchedService) {
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
    if (id) {
      fetchService();
    }
  }, [id]);

  const handleCustomQuoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(res => setTimeout(res, 1500));
    // In a real app, you would send this data to a server action
    // await submitCustomQuoteAction(formData);
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

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card border-b">
          <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                  <Badge variant="secondary">{service.category.name}</Badge>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight">{service.title}</h1>
                  <p className="text-lg text-muted-foreground">{service.shortDescription}</p>
                  <div className="flex gap-4 pt-4">
                      <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          <Link href="#packages">Choose a Package</Link>
                      </Button>
                      <Button size="lg" variant="outline" asChild>
                          <Link href="#custom-quote">Get a Custom Quote</Link>
                      </Button>
                  </div>
              </div>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image src={service.imageUrl} alt={service.title} fill className="object-cover" data-ai-hint={service.dataAiHint || "service visual"}/>
              </div>
          </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Find the Perfect Plan</h2>
            <p className="text-muted-foreground mt-2">Choose the package that best fits your needs. All plans are flexible and can be customized.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {examplePackages.map(pkg => (
              <Card key={pkg.name} className={`flex flex-col ${pkg.isPopular ? 'border-primary border-2 shadow-xl' : ''}`}>
                {pkg.isPopular && <Badge className="w-fit self-center -mt-3">Most Popular</Badge>}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-6">
                  <p className="text-4xl font-bold text-center text-foreground">{formatIDR(parseInt(pkg.price.replace(/\./g, ''), 10))}</p>
                  <ul className="space-y-3 text-muted-foreground">
                    {pkg.features.map(feature => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full ${pkg.isPopular ? '' : 'bg-primary/90 hover:bg-primary'}`} variant={pkg.isPopular ? 'default' : 'secondary'}>
                    {pkg.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Quote Section */}
      <section id="custom-quote" className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Still not sure?</h2>
              <p className="text-muted-foreground text-lg">Tell us about your project, and we'll craft a custom package tailored just for you. No obligations, just possibilities.</p>
              <div className="flex items-start p-4 bg-primary/10 rounded-lg">
                <Bot className="h-8 w-8 text-primary mr-4 mt-1 flex-shrink-0"/>
                <p className="text-sm text-primary/80">Our team will analyze your needs and provide a personalized recommendation and quote within 24 hours.</p>
              </div>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Describe Your Project</CardTitle>
                    <CardDescription>The more details you provide, the better we can assist you.</CardDescription>
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

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {exampleFaq.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-lg text-left hover:no-underline"><HelpCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0"/>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground pl-10">
                        {item.a}
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
          <Button variant="outline" asChild className="group">
            <Link href="/services">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
              Back to All Services
            </Link>
          </Button>
        </div>
    </div>
  );
}
