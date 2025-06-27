
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/AuthContext';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, Settings, Briefcase, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PurchasedService {
  id: string; // The original item ID from the order
  orderId: string;
  purchaseDate: string;
  serviceTitle: string;
  packageName: string;
  status: 'Active' | 'Expired'; // Simplified status
  serviceUrl?: string | null;
}

// Function to parse the service title, e.g., "Business Website (Pro Plan - 12 months)"
function parseServiceTitle(title: string): { serviceTitle: string; packageName: string } {
  const match = title.match(/(.*) \((.*)\)/);
  if (match && match[1] && match[2]) {
    return { serviceTitle: match[1], packageName: match[2] };
  }
  // Fallback for titles that don't match the pattern (e.g., fixed-price projects)
  return { serviceTitle: title, packageName: 'One-Time Project' };
}

export default function MyServicesPage() {
  const { user } = useAuth();
  const [purchasedServices, setPurchasedServices] = useState<PurchasedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getOrdersByUserIdFromFirestore(user.uid)
        .then(async (userOrders) => {
          const completedOrders = userOrders.filter(order => order.status === 'completed');
          
          // Get unique service slugs
          const serviceSlugs = new Set<string>();
          completedOrders.forEach(order => {
            order.items.forEach(item => {
              if (item.id.includes(':')) {
                const slug = item.id.split(':')[0];
                if (slug) serviceSlugs.add(slug);
              }
            });
          });

          // Fetch all unique services
          const servicePromises = Array.from(serviceSlugs).map(slug => getServiceBySlugFromFirestore(slug));
          const servicesData = await Promise.all(servicePromises);

          // Create a map for easy lookup
          const serviceMap = new Map<string, { serviceUrl?: string | null }>();
          servicesData.forEach(service => {
            if (service) {
              serviceMap.set(service.slug, { serviceUrl: service.serviceUrl });
            }
          });

          // Build the final list of purchased services
          const services: PurchasedService[] = [];
          completedOrders.forEach(order => {
            order.items.forEach(item => {
              if (item.id.includes(':')) {
                const slug = item.id.split(':')[0];
                const serviceDetails = serviceMap.get(slug);
                const { serviceTitle, packageName } = parseServiceTitle(item.title);
                services.push({
                  id: item.id,
                  orderId: order.orderId,
                  purchaseDate: order.createdAt,
                  serviceTitle,
                  packageName,
                  status: 'Active', // Simplified for now. Real logic would check renewal dates.
                  serviceUrl: serviceDetails?.serviceUrl || null,
                });
              }
            });
          });

          setPurchasedServices(services);
        })
        .catch((err) => {
          console.error('Failed to fetch user orders for services:', err);
          setError('Could not load your services. Please try again later.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
        setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] p-4 md:p-6 lg:p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Briefcase className="mr-3 h-8 w-8 text-primary" />
          My Services
        </h1>
        <Button variant="outline" asChild className="group">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      {error ? (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader>
            <CardTitle className="text-destructive">Error Loading Services</CardTitle>
            </CardHeader>
            <CardContent><p>{error}</p></CardContent>
        </Card>
      ) : purchasedServices.length === 0 ? (
        <Card className="text-center py-12">
            <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                    <Briefcase className="h-10 w-10 text-primary" />
                </div>
                <CardTitle>You Have No Active Services</CardTitle>
                <CardDescription>Once you purchase a service, it will appear here.</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
                <Button asChild>
                    <Link href="/services">
                        <PlusCircle className="mr-2 h-4 w-4" /> Explore Our Services
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchasedServices.map((service, index) => (
            <Card key={`${service.id}-${index}`} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold leading-tight pr-4">{service.serviceTitle}</h3>
                    <Badge variant="outline" className={service.status === 'Active' ? 'text-green-600 border-green-500/50 bg-green-500/10' : 'text-muted-foreground'}>{service.status}</Badge>
                </div>
                <CardDescription>{service.packageName}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-grow">
                <p>Purchased on: {format(new Date(service.purchaseDate), "PPP")}</p>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4">
                 <Button className="w-full" asChild disabled={!service.serviceUrl}>
                    <Link href={service.serviceUrl || '#'} target="_blank" rel="noopener noreferrer">
                        <Settings className="mr-2 h-4 w-4" /> Manage Service
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
