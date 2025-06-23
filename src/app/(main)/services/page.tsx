
'use client'; 

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X, ListFilter } from 'lucide-react';
import type { Service, ServiceCategory } from '@/lib/types';
import { getAllServicesFromFirestore } from '@/lib/firebase/firestoreServices';
import { cn } from '@/lib/utils';
import { ServiceCard } from '@/components/shared/ServiceCard';

export default function ServicesPage() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      try {
        const result = await getAllServicesFromFirestore({ pageSize: 0 }); // Fetch all
        setAllServices(result.data);
      } catch (error) {
        console.error("Failed to fetch services for listing page:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, []);

  useEffect(() => {
    const categoryFromQuery = searchParams.get('category');
    if (categoryFromQuery && SERVICE_CATEGORIES.some(cat => cat.slug === categoryFromQuery)) {
      setSelectedCategory(categoryFromQuery);
    } else if (!categoryFromQuery) { 
      setSelectedCategory(null);
    }
  }, [searchParams]);

  const handleSelectCategory = (slug: string | null) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(window.location.search);
    if (slug) {
        params.set('category', slug);
    } else {
        params.delete('category');
    }
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };
  
  const filteredServices = useMemo(() => {
    return allServices
      .filter(service => service.status === 'active') // Only show active services
      .filter((service) => {
        const categoryMatch = selectedCategory ? service.category.slug === selectedCategory : true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        let searchMatch = true;
        if (lowerSearchTerm) {
          const titleMatch = service.title.toLowerCase().includes(lowerSearchTerm);
          const descriptionMatch = service.shortDescription.toLowerCase().includes(lowerSearchTerm);
          const categoryNameMatch = service.category.name.toLowerCase().includes(lowerSearchTerm);
          const tagsMatch = service.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
          searchMatch = titleMatch || descriptionMatch || categoryNameMatch || tagsMatch;
        }
        
        return categoryMatch && searchMatch;
      });
  }, [selectedCategory, searchTerm, allServices]);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Our Services
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our range of professional services designed to help you succeed.
        </p>
      </div>
      
      <div className="mb-8 max-w-xl mx-auto relative">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
        <Input 
          type="text"
          placeholder="Search services by title, category, tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 text-base h-12 w-full rounded-full bg-muted border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
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

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ListFilter className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Filter by Category</h3>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => handleSelectCategory(null)}
              className={cn("transition-all duration-200 ease-in-out", selectedCategory === null ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground hover:border-accent")}
            >
              All
            </Button>
            {SERVICE_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                onClick={() => handleSelectCategory(category.slug)}
                className={cn("transition-all duration-200 ease-in-out", selectedCategory === category.slug ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground hover:border-accent")}
              >
                {category.name}
              </Button>
            ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No services found matching your criteria.</p>
          </div>
        )
      )}
    </div>
  );
}
