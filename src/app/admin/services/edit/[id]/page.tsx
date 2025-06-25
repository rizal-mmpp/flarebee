
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceForm } from '@/components/sections/admin/ServiceForm'; 
import { type ServiceFormValues, serviceFormSchema } from '@/components/sections/admin/ServiceFormTypes'; 
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import { updateServiceAction } from '@/lib/actions/service.actions'; 
import type { Service, ServicePackage } from '@/lib/types'; 
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, Edit3, ArrowLeft, Save, Rocket, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.id as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [service, setService] = useState<Service | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [selectedFixedPriceImageFile, setSelectedFixedPriceImageFile] = useState<File | null>(null);
  const [fixedPriceImagePreviewUrl, setFixedPriceImagePreviewUrl] = useState<string | null>(null);


  const { register, handleSubmit, control, formState: { errors }, setValue, watch, getValues } = useForm<ServiceFormValues>({ 
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      pricing: {
        isFixedPriceActive: false,
        isSubscriptionActive: false,
        isCustomQuoteActive: false,
        fixedPriceDetails: { bgClassName: 'bg-background', price: 0, title: '', description: '', imageAiHint: '' },
        subscriptionDetails: { bgClassName: 'bg-card', packages: [] },
        customQuoteDetails: { bgClassName: 'bg-background', title: '', text: '', infoBoxText: '', formTitle: '', formDescription: '' }
      },
      showFaqSection: false,
      faq: []
    }
  });
  
  const watchedImageUrl = watch('imageUrl'); 
  const watchedFixedPriceImageUrl = watch('pricing.fixedPriceDetails.imageUrl');

  useEffect(() => {
    if (slug) {
      setIsLoading(true);
      setError(null);
      getServiceBySlugFromFirestore(slug)
        .then((fetchedService) => { 
          if (fetchedService) {
            setService(fetchedService);
            
            setValue('title', fetchedService.title);
            setValue('shortDescription', fetchedService.shortDescription || '');
            setValue('longDescription', fetchedService.longDescription || '');
            setValue('categoryId', fetchedService.category.id);
            setValue('tags', fetchedService.tags.join(', '));
            setValue('imageUrl', fetchedService.imageUrl);
            setImagePreviewUrl(fetchedService.imageUrl);
            setValue('dataAiHint', fetchedService.dataAiHint || '');
            setValue('status', fetchedService.status || 'draft');
            setValue('keyFeatures', fetchedService.keyFeatures?.join(', ') || '');
            setValue('targetAudience', fetchedService.targetAudience?.join(', ') || '');
            setValue('estimatedDuration', fetchedService.estimatedDuration || '');
            setValue('portfolioLink', fetchedService.portfolioLink || '');
            
            setValue('pricing.isFixedPriceActive', fetchedService.pricing?.isFixedPriceActive || false);
            setValue('pricing.fixedPriceDetails.bgClassName', fetchedService.pricing?.fixedPriceDetails?.bgClassName || 'bg-background');
            setValue('pricing.fixedPriceDetails.title', fetchedService.pricing?.fixedPriceDetails?.title || 'One-Time Project');
            setValue('pricing.fixedPriceDetails.description', fetchedService.pricing?.fixedPriceDetails?.description || 'A single payment for a defined scope of work.');
            setValue('pricing.fixedPriceDetails.price', fetchedService.pricing?.fixedPriceDetails?.price || 0);
            setValue('pricing.fixedPriceDetails.imageUrl', fetchedService.pricing?.fixedPriceDetails?.imageUrl || null);
            setValue('pricing.fixedPriceDetails.imageAiHint', fetchedService.pricing?.fixedPriceDetails?.imageAiHint || '');
            setFixedPriceImagePreviewUrl(fetchedService.pricing?.fixedPriceDetails?.imageUrl || null);


            setValue('pricing.isSubscriptionActive', fetchedService.pricing?.isSubscriptionActive || false);
            setValue('pricing.subscriptionDetails.bgClassName', fetchedService.pricing?.subscriptionDetails?.bgClassName || 'bg-card');
            
            // Set packages directly, no more string formatting for features
            setValue('pricing.subscriptionDetails.packages', fetchedService.pricing?.subscriptionDetails?.packages || []);
            
            setValue('pricing.isCustomQuoteActive', fetchedService.pricing?.isCustomQuoteActive || false);
            setValue('pricing.customQuoteDetails', fetchedService.pricing?.customQuoteDetails || { title: '', text: '', infoBoxText: '', formTitle: '', formDescription: '' });

            setValue('showFaqSection', fetchedService.showFaqSection || false);
            setValue('faq', fetchedService.faq || []);

          } else {
            setError('Service not found.'); 
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service for editing:', err); 
          setError('Failed to load service data. Please try again.'); 
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [slug, setValue]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFile) {
      objectUrl = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(objectUrl);
    } else if (watchedImageUrl) { 
      setImagePreviewUrl(watchedImageUrl);
    } else {
        setImagePreviewUrl(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedFile, watchedImageUrl]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFixedPriceImageFile) {
      objectUrl = URL.createObjectURL(selectedFixedPriceImageFile);
      setFixedPriceImagePreviewUrl(objectUrl);
    } else if (watchedFixedPriceImageUrl) {
      setFixedPriceImagePreviewUrl(watchedFixedPriceImageUrl);
    } else {
      setFixedPriceImagePreviewUrl(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFixedPriceImageFile, watchedFixedPriceImageUrl]);


  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (!file && service) {
        setImagePreviewUrl(service.imageUrl);
        setValue('imageUrl', service.imageUrl); 
    }
  };

   const handleFixedPriceImageFileChange = (file: File | null) => {
    setSelectedFixedPriceImageFile(file);
    if (!file && service?.pricing?.fixedPriceDetails?.imageUrl) {
        setFixedPriceImagePreviewUrl(service.pricing.fixedPriceDetails.imageUrl);
        setValue('pricing.fixedPriceDetails.imageUrl', service.pricing.fixedPriceDetails.imageUrl);
    }
  };

  const onSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    if (!service) return;
    startTransition(async () => {
      const formDataForAction = new FormData();
      
      if (selectedFile) {
        formDataForAction.append('imageFile', selectedFile);
      }
      formDataForAction.append('currentImageUrl', data.imageUrl || service.imageUrl || '');

      if (selectedFixedPriceImageFile) {
        formDataForAction.append('fixedPriceImageFile', selectedFixedPriceImageFile);
      }
      formDataForAction.append('currentFixedPriceImageUrl', data.pricing?.fixedPriceDetails?.imageUrl || service.pricing?.fixedPriceDetails?.imageUrl || '');


      // Append primitive values directly
      formDataForAction.append('title', data.title);
      formDataForAction.append('shortDescription', data.shortDescription);
      formDataForAction.append('longDescription', data.longDescription);
      formDataForAction.append('categoryId', data.categoryId);
      formDataForAction.append('tags', data.tags);
      formDataForAction.append('dataAiHint', data.dataAiHint || '');
      formDataForAction.append('status', data.status);
      formDataForAction.append('keyFeatures', data.keyFeatures || '');
      formDataForAction.append('targetAudience', data.targetAudience || '');
      formDataForAction.append('estimatedDuration', data.estimatedDuration || '');
      formDataForAction.append('portfolioLink', data.portfolioLink || '');
      formDataForAction.append('showFaqSection', String(data.showFaqSection));

      // Stringify complex objects
      formDataForAction.append('pricing', JSON.stringify(data.pricing));
      formDataForAction.append('faq', JSON.stringify(data.faq));
      
      const result = await updateServiceAction(service.id, formDataForAction);

      if (result.error) {
        const errorMessage = result.error;
        toast({
          title: 'Error Updating Service',
          description: (
            <div className="flex w-full items-start justify-between gap-4">
              <p className="text-sm pr-4 break-words">{errorMessage}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-destructive-foreground/80 hover:bg-destructive-foreground/20 hover:text-destructive-foreground"
                onClick={() => navigator.clipboard.writeText(errorMessage)}
                aria-label="Copy error message"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ),
          variant: "destructive",
          duration: Infinity, // Keep it visible
        });
      } else {
        toast({
          title: 'Service Updated Successfully',
          description: result.message || 'The service details have been updated.',
        });
      }
    });
  };

  const handleCancel = () => {
    router.back(); 
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading service for editing...</p> 
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!service) {
     return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-6">Service data could not be loaded or service does not exist.</p> 
        <Button variant="outline" asChild className="group">
          <Link href="/admin/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Edit3 className="mr-3 h-7 w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate" title={service.title}>Edit: {service.title}</span>
          </h1>
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center justify-start sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" type="button" onClick={handleCancel} disabled={isPending}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Cancel</span></Button></TooltipTrigger><TooltipContent><p>Cancel & Go Back</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button asChild variant="outline" size="icon" type="button" disabled={isPending}><Link href={`/admin/services/${slug}/simulate-journey`}><Rocket className="h-4 w-4" /><span className="sr-only">Customer Journey</span></Link></Button></TooltipTrigger><TooltipContent><p>Customer Journey</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}<span className="sr-only">Update Service</span></Button></TooltipTrigger><TooltipContent><p>Update Service</p></TooltipContent></Tooltip>
            </div>
          </TooltipProvider>
        </div>
        <ServiceForm 
            control={control} 
            register={register} 
            errors={errors}
            watch={watch} 
            setValue={setValue}
            getValues={getValues}
            currentImageUrl={imagePreviewUrl}
            onFileChange={handleFileChange}
            selectedFileName={selectedFile?.name}
            currentFixedPriceImageUrl={fixedPriceImagePreviewUrl}
            onFixedPriceFileChange={handleFixedPriceImageFileChange}
            selectedFixedPriceFileName={selectedFixedPriceImageFile?.name}
            isEditMode={true}
        />
      </div>
    </form>
  );
}
