
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { getServiceFromErpNextByName } from '@/lib/actions/erpnext.actions';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, Briefcase, Edit, Tag, Info, DollarSign, Clock, Users, LinkIcon, ExternalLink, ListChecks, Check, HelpCircle, Rocket, FileText, Settings, Sparkles, Package, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

const formatIDR = (amount?: number | null) => {
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

const InfoRow = ({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
    <div className="space-y-1">
        <h4 className="font-semibold text-muted-foreground flex items-center">
            {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80" />}
            {label}
        </h4>
        <div className="text-foreground text-sm">{value}</div>
    </div>
);

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceName = params.id as string;
  const { erpSid } = useCombinedAuth();

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceName && erpSid) {
      setIsLoading(true);
      setError(null);
      getServiceFromErpNextByName({ sid: erpSid, serviceName })
        .then((result) => {
          if (result.success && result.data) {
            setService(result.data);
          } else {
            setError(result.error || 'Service not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service details:', err);
          setError('Failed to load service details. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!erpSid) {
        setError('Not authenticated with ERPNext.');
        setIsLoading(false);
    }
  }, [serviceName, erpSid]);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Briefcase className="mr-3 h-8 w-8 text-primary flex-shrink-0" />
            <span className="truncate" title={service.title}>{service.title}</span>
          </h1>
        </div>
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center justify-start sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => router.push('/admin/services')}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back to Services</span></Button></TooltipTrigger><TooltipContent><p>Back to Services</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => router.push(`/admin/services/edit/${service.id}`)}><Edit className="h-4 w-4" /><span className="sr-only">Edit Service</span></Button></TooltipTrigger><TooltipContent><p>Edit Service</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="default" size="icon" onClick={() => router.push(`/admin/services/${service.id}/simulate-journey`)} className="bg-primary hover:bg-primary/90"><Rocket className="h-4 w-4" /><span className="sr-only">Customer Journey</span></Button></TooltipTrigger><TooltipContent><p>Customer Journey</p></TooltipContent></Tooltip>
          </div>
        </TooltipProvider>
      </div>

       <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="general"><Settings className="mr-2 h-4 w-4 hidden sm:inline-block"/>General</TabsTrigger>
          <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4 hidden sm:inline-block"/>Content</TabsTrigger>
          <TabsTrigger value="pricing"><DollarSign className="mr-2 h-4 w-4 hidden sm:inline-block"/>Pricing</TabsTrigger>
          <TabsTrigger value="faq"><HelpCircle className="mr-2 h-4 w-4 hidden sm:inline-block"/>FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">General Information</CardTitle>
                    <CardDescription>{service.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoRow label="Category" value={service.category.name} icon={Tag} />
                    <InfoRow label="Status" value={<Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(service.status))}>{service.status}</Badge>} icon={Info} />
                    <InfoRow label="Estimated Duration" value={service.estimatedDuration || 'N/A'} icon={Clock} />
                    <div className="md:col-span-2 lg:col-span-3">
                        <h4 className="font-semibold text-muted-foreground mb-2 flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-primary/80" />Service Image</h4>
                        {service.imageUrl && (
                             <div className="relative w-full max-w-sm aspect-[16/9] rounded-lg overflow-hidden border bg-muted">
                                <Image src={service.imageUrl} alt={service.title} fill style={{objectFit:"cover"}} data-ai-hint={service.dataAiHint || "service image"} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="content">
            <Card>
                <CardHeader><CardTitle className="text-xl">Detailed Content</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <h4 className="font-semibold text-foreground mb-2">Detailed Description</h4>
                        <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80"><ReactMarkdown>{service.longDescription}</ReactMarkdown></article>
                    </div>
                    {service.keyFeatures && service.keyFeatures.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary/80" />Key Features</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">{service.keyFeatures.map((feature, index) => <li key={`kf-${index}`}>{feature}</li>)}</ul>
                        </div>
                    )}
                    {service.targetAudience && service.targetAudience.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center"><Users className="mr-2 h-5 w-5 text-primary/80" />Target Audience</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">{service.targetAudience.map((audience, index) => <li key={`ta-${index}`}>{audience}</li>)}</ul>
                        </div>
                    )}
                    {service.tags && service.tags.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary/80" />Tags</h4>
                            <div className="flex flex-wrap gap-2">{service.tags.map((tag) => (<Badge key={tag} variant="outline">{tag}</Badge>))}</div>
                        </div>
                    )}
                    <InfoRow label="Portfolio" value={service.portfolioLink ? <Link href={service.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">View Portfolio <ExternalLink className="inline-block ml-1 h-3 w-3" /></Link> : 'N/A'} icon={LinkIcon} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="pricing">
            <Card>
                <CardHeader><CardTitle className="text-xl">Pricing Information</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {service.pricing?.isFixedPriceActive && service.pricing.fixedPriceDetails && (
                        <InfoRow label="Fixed Price" value={formatIDR(service.pricing.fixedPriceDetails.price)} icon={Package} />
                    )}

                    {service.pricing?.isCustomQuoteActive && (
                        <InfoRow label="Custom Quote" value={service.pricing.customQuoteDetails?.description || "Available"} icon={Sparkles} />
                    )}
                    
                    {service.pricing?.isSubscriptionActive && service.pricing.subscriptionDetails && (
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary/80" />Subscription Packages</h4>
                             <div className="text-sm text-muted-foreground mb-3">Background Class: <Badge variant="outline">{service.pricing.subscriptionDetails.bgClassName || 'Not Set'}</Badge></div>
                            {service.pricing.subscriptionDetails.packages && service.pricing.subscriptionDetails.packages.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {service.pricing.subscriptionDetails.packages.map((pkg, index) => (
                                <Card key={pkg.id || `pkg-${index}`} className={cn('flex flex-col', pkg.isPopular && 'border-primary')}>
                                    {pkg.isPopular && <Badge className="w-fit self-center -mt-3 mb-2">Most Popular</Badge>}
                                    <CardHeader><CardTitle>{pkg.name}</CardTitle><CardDescription>{pkg.description}</CardDescription></CardHeader>
                                    <CardContent className="flex-grow space-y-2">
                                    <p className="text-xl font-bold mb-1">{formatIDR(pkg.priceMonthly)} / month</p>
                                    <p className="text-sm text-muted-foreground">Original Monthly: {formatIDR(pkg.originalPriceMonthly)}</p>
                                    <p className="text-sm text-muted-foreground">Discount Method: {pkg.annualPriceCalcMethod}</p>
                                    <p className="text-sm text-muted-foreground">Discount %: {pkg.annualDiscountPercentage}%</p>
                                    <p className="text-sm text-muted-foreground">Discounted Monthly: {formatIDR(pkg.discountedMonthlyPrice)}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{pkg.renewalInfo}</p>
                                    <h5 className="font-semibold text-sm pt-2">Features:</h5>
                                    <ul className="space-y-1 text-xs text-muted-foreground">{pkg.features.map((feature, fIndex) => (<li key={feature.id || `feat-${fIndex}`} className={cn("flex items-center", feature.isIncluded ? "text-foreground" : "text-muted-foreground line-through")}><Check className="h-3 w-3 mr-2 text-green-500"/>{feature.text}</li>))}</ul>
                                    </CardContent>
                                    <CardFooter><Button variant="outline" className="w-full" disabled>{pkg.cta || 'Choose Plan'}</Button></CardFooter>
                                </Card>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No subscription packages defined for this service.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="faq">
            <Card>
                <CardHeader><CardTitle className="text-xl">Frequently Asked Questions</CardTitle></CardHeader>
                <CardContent>
                    {service.showFaqSection && service.faq && service.faq.length > 0 ? (
                         <Accordion type="single" collapsible className="w-full">
                            {service.faq.map((item, i) => (<AccordionItem key={item.id || `faq-${i}`} value={`item-${i}`}><AccordionTrigger className="text-left"><HelpCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0"/>{item.q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground pl-10">{item.a}</AccordionContent></AccordionItem>))}
                        </Accordion>
                    ) : (
                        <p className="text-sm text-muted-foreground">The FAQ section is not enabled for this service.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
