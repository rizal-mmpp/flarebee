
'use server';

import { Suspense } from 'react';
import { getPublicServicesFromErpNext } from '@/lib/actions/erpnext/item.actions';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Briefcase } from 'lucide-react';
import { CategoryFilter } from '@/components/sections/templates/CategoryFilter';
import { SERVICE_CATEGORIES } from '@/lib/constants';

async function ServicesList({ category }: { category?: string }) {
  const result = await getPublicServicesFromErpNext({ categorySlug: category });

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit mb-3">
              <Briefcase className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Could Not Load Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{result.error || 'An unexpected error occurred.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = result.data;

  if (services.length === 0) {
    return (
      <div className="text-center py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No Services Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No services matched the current filter criteria.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams?: { category?: string; };
}) {
  const selectedCategory = searchParams?.category;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center justify-center">
          <Compass className="mr-4 h-10 w-10 text-primary" /> Our Services
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our range of professional services designed to help you succeed.
        </p>
      </div>
      
      {/* CategoryFilter is now a server-aware component that navigates */}
      <CategoryFilter categories={SERVICE_CATEGORIES} selectedCategory={selectedCategory || null} />

      <Suspense fallback={<div className="text-center py-20">Loading services...</div>}>
        <ServicesList category={selectedCategory} />
      </Suspense>
    </div>
  );
}
