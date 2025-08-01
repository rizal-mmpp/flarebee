
'use server'; 

import type { Service } from '@/lib/types';
import { getPublicServiceBySlug } from '@/lib/actions/erpnext/item.actions';
import { notFound } from 'next/navigation'; 
import { Button } from '@/components/ui/button';
import { ArrowLeft, ServerCrash } from 'lucide-react'; 
import Link from 'next/link';
import { ServicePurchaseClientWrapper } from './ServicePurchaseClientWrapper';

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const slug = params.id;
  // Fetch data as a guest on the server.
  // The client wrapper will handle authenticated actions.
  const result = await getPublicServiceBySlug({ slug, sid: null });

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
  
  // The client component now handles all rendering.
  return <ServicePurchaseClientWrapper service={service} />;
}
