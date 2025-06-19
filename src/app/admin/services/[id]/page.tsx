
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, Briefcase, Edit, Tag, Info, DollarSign, Clock, Users, LinkIcon, ExternalLink, ListChecks, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formatIDR = (amount?: number) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadgeVariant = (status: Service['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'inactive':
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
    case 'draft':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      setIsLoading(true);
      setError(null);
      getServiceByIdFromFirestore(serviceId)
        .then((fetchedService) => {
          if (fetchedService) {
            setService(fetchedService);
          } else {
            setError('Service not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service details:', err);
          setError('Failed to load service details. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [serviceId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading service details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Service</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/services">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Briefcase className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested service could not be found.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/services">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Briefcase className="mr-3 h-8 w-8 text-primary flex-shrink-0" />
            <span className="truncate">{service.title}</span>
          </h1>
        </div>
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center justify-start sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => router.push('/admin/services')}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to Services</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Back to Services</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="icon" onClick={() => router.push(`/admin/services/${service.id}/simulate-journey`)} className="bg-primary hover:bg-primary/90">
                  <Play className="h-4 w-4" />
                  <span className="sr-only">Simulate Customer Journey</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Simulate Customer Journey</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="outline" size="icon" onClick={() => router.push(`/admin/services/edit/${service.id}`)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit Service</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Service</p></TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Service Overview</CardTitle>
          <CardDescription>{service.shortDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-primary/80" />Category</h4>
              <p className="text-foreground">{service.category.name}</p>
            </div>
             <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><Info className="mr-2 h-4 w-4 text-primary/80" />Status</h4>
              <Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(service.status))}>
                {service.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><DollarSign className="mr-2 h-4 w-4 text-primary/80" />Pricing Model</h4>
              <p className="text-foreground">{service.pricingModel}</p>
            </div>
             {(service.pricingModel === "Fixed Price" || service.pricingModel === "Starting At" || service.pricingModel === "Hourly" || service.pricingModel === "Subscription") && (
                <div className="space-y-1">
                    <h4 className="font-semibold text-muted-foreground flex items-center"><DollarSign className="mr-2 h-4 w-4 text-primary/80" />Price</h4>
                    <p className="text-foreground">{formatIDR(service.priceMin)} {service.priceMax ? `- ${formatIDR(service.priceMax)}` : ''} ({service.currency})</p>
                </div>
            )}
            {service.estimatedDuration && (
                <div className="space-y-1">
                    <h4 className="font-semibold text-muted-foreground flex items-center"><Clock className="mr-2 h-4 w-4 text-primary/80" />Est. Duration</h4>
                    <p className="text-foreground">{service.estimatedDuration}</p>
                </div>
            )}
            {service.portfolioLink && (
                 <div className="space-y-1">
                    <h4 className="font-semibold text-muted-foreground flex items-center"><LinkIcon className="mr-2 h-4 w-4 text-primary/80" />Portfolio</h4>
                    <Link href={service.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      View Portfolio <ExternalLink className="inline-block ml-1 h-3 w-3" />
                    </Link>
                </div>
            )}
        </CardContent>
      </Card>

      {service.imageUrl && (
        <Card>
          <CardHeader><CardTitle className="text-xl">Service Image</CardTitle></CardHeader>
          <CardContent>
             <div className="relative w-full max-w-md aspect-[16/9] rounded-lg overflow-hidden border bg-muted">
                <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    style={{objectFit:"cover"}}
                    data-ai-hint={service.dataAiHint || "service image"}
                />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Detailed Description</CardTitle>
        </CardHeader>
        <CardContent>
           <article className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80">
             <ReactMarkdown>{service.longDescription}</ReactMarkdown>
           </article>
        </CardContent>
      </Card>
      
      {(service.keyFeatures && service.keyFeatures.length > 0) || (service.targetAudience && service.targetAudience.length > 0) || (service.tags && service.tags.length > 0) ? (
        <Card>
            <CardHeader><CardTitle className="text-xl">Additional Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                {service.keyFeatures && service.keyFeatures.length > 0 && (
                <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary/80" />Key Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {service.keyFeatures.map((feature, index) => <li key={`kf-${index}`}>{feature}</li>)}
                    </ul>
                </div>
                )}
                {service.targetAudience && service.targetAudience.length > 0 && (
                <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center"><Users className="mr-2 h-5 w-5 text-primary/80" />Target Audience</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {service.targetAudience.map((audience, index) => <li key={`ta-${index}`}>{audience}</li>)}
                    </ul>
                </div>
                )}
                {service.tags && service.tags.length > 0 && (
                <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary/80" />Tags</h4>
                    <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
      ) : null}

      <CardFooter className="flex justify-end border-t pt-6">
           <Button variant="outline" onClick={() => router.push('/admin/services')} className="group">
             <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
             Back to Services
           </Button>
        </CardFooter>
    </div>
  );
}

    
