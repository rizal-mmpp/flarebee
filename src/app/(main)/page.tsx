'use client'; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Target, Brush } from 'lucide-react';
import type { Service } from '@/lib/types';
import { getAllServicesFromFirestore } from '@/lib/firebase/firestoreServices';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      try {
        const result = await getAllServicesFromFirestore({ pageSize: 3 }); 
        setFeaturedServices(result.data);
      } catch (error) {
        console.error("Failed to fetch services for homepage:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, []);


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="text-center py-20 md:py-32 bg-gradient-to-b from-card to-background">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Turn Your Vision into a Digital Reality
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            We provide professional services to build, automate, and scale your business online. From stunning websites to intelligent automation, we are your partners in innovation.
          </p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg rounded-full group">
            <Link href="/services">
              Explore Our Services <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Brush className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Bespoke Design</h3>
                    <p className="text-muted-foreground">Crafting unique and beautiful websites tailored to your brand identity.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">AI & Automation</h3>
                    <p className="text-muted-foreground">Leveraging intelligent automation to streamline your business processes.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Strategic Solutions</h3>
                    <p className="text-muted-foreground">Delivering technology solutions that align with your strategic goals.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Featured Services Section */}
       <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6">
           <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Services</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started with our most popular solutions designed for growth.
              </p>
            </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : featuredServices.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No services are featured at the moment.</p>
          )}
        </div>
      </section>

    </div>
  );
}
