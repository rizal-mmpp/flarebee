
'use client'; 

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X, ListFilter, Briefcase, Compass } from 'lucide-react';
import type { Service } from '@/lib/types';
import { getPublicServicesFromErpNext } from '@/lib/actions/erpnext/item.actions';
import { cn } from '@/lib/utils';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryFilter } from '@/components/sections/templates/CategoryFilter';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

function ServicesGrid() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const category = searchParams.get('category');

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    const result = await getPublicServicesFromErpNext({ categorySlug: category || undefined });
    if (result.success && result.data) {
      setServices(result.data);
    } else {
      console.error("Failed to fetch services:", result.error);
      setServices([]);
    }
    setIsLoading(false);
  }, [category]);
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      if (!lowerSearchTerm) return true;
      
      const titleMatch = service.title.toLowerCase().includes(lowerSearchTerm);
      const descriptionMatch = service.shortDescription.toLowerCase().includes(lowerSearchTerm);
      const categoryNameMatch = service.category.name.toLowerCase().includes(lowerSearchTerm);
      const tagsMatch = service.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
      
      return titleMatch || descriptionMatch || categoryNameMatch || tagsMatch;
    });
  }, [searchTerm, services]);

  return (
    <div className="space-y-8">
       <div className="max-w-xl relative">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
        <Input 
          type="text"
          placeholder="Search services by title, category, tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 text-base h-12 w-full rounded-full bg-card border-border/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
        />
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSearchTerm('')} 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <CategoryFilter categories={SERVICE_CATEGORIES} selectedCategory={category} />

       {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>No Services Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No services matched your current filter criteria.
                  </p>
                </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
}

export default function BrowseServicesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Compass className="mr-3 h-8 w-8 text-primary" />
          Browse Services
        </h1>
      </div>
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
        <ServicesGrid />
      </Suspense>
    </div>
  );
}
