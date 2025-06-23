
'use server';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Palette, Rocket } from 'lucide-react';
import type { Service, HomePageContent } from '@/lib/types';
import { getAllServicesFromFirestore } from '@/lib/firebase/firestoreServices';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import { HeroIllustration } from '@/components/shared/HeroIllustration';

export default async function HomePage() {
  const [servicesResult, heroContentResult] = await Promise.all([
    getAllServicesFromFirestore({ pageSize: 3 }),
    getSitePageContent('home-page'),
  ]);

  const featuredServices = servicesResult.data;
  const heroContent = heroContentResult as HomePageContent;

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-background via-background to-primary/5">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"
        ></div>
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {heroContent.tagline}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0 mb-10 leading-relaxed">
              {heroContent.subTagline}
            </p>
            <div className="flex flex-wrap gap-4">
              {heroContent.ctaButtonText && heroContent.ctaButtonLink && (
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg rounded-full group">
                  <Link href={heroContent.ctaButtonLink}>
                    {heroContent.ctaButtonText} <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="px-10 py-6 text-lg rounded-full group">
                <Link href="/contact-us">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Us?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We blend creativity with technology to deliver solutions that are not just beautiful, but also powerful and strategic.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 border border-transparent hover:border-border rounded-2xl hover:bg-card transition-all">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Bespoke Design</h3>
              <p className="text-muted-foreground">Crafting unique and beautiful websites tailored to your brand identity.</p>
            </div>
            <div className="flex flex-col items-center p-6 border border-transparent hover:border-border rounded-2xl hover:bg-card transition-all">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI & Automation</h3>
              <p className="text-muted-foreground">Leveraging intelligent automation to streamline your business processes.</p>
            </div>
            <div className="flex flex-col items-center p-6 border border-transparent hover:border-border rounded-2xl hover:bg-card transition-all">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Strategic Solutions</h3>
              <p className="text-muted-foreground">Delivering technology solutions that align with your strategic goals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="py-16 md:py-24 bg-card border-t border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with our most popular solutions designed for growth.
            </p>
          </div>
          {featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center py-10">
                <p className="text-center text-muted-foreground">No services are featured at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
