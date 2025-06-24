
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceForm } from '@/components/sections/admin/ServiceForm'; 
import { type ServiceFormValues, serviceFormSchema } from '@/components/sections/admin/ServiceFormTypes'; 
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import { updateServiceAction } from '@/lib/actions/service.actions'; 
import type { Service } from '@/lib/types'; 
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, Edit3, ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

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


  const { register, handleSubmit, control, formState: { errors }, setValue, watch, getValues } = useForm<ServiceFormValues>({ 
    resolver: zodResolver(serviceFormSchema),
  });
  
  const watchedImageUrl = watch('imageUrl'); 

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
            setValue('pricingModel', fetchedService.pricingModel || 'Custom Quote');
            setValue('priceMin', fetchedService.priceMin);
            setValue('priceMax', fetchedService.priceMax);
            setValue('currency', fetchedService.currency || 'IDR');
            setValue('tags', fetchedService.tags.join(', '));
            setValue('imageUrl', fetchedService.imageUrl);
            setImagePreviewUrl(fetchedService.imageUrl);
            setValue('dataAiHint', fetchedService.dataAiHint || '');
            setValue('status', fetchedService.status || 'draft');
            setValue('keyFeatures', fetchedService.keyFeatures?.join(', ') || '');
            setValue('targetAudience', fetchedService.targetAudience?.join(', ') || '');
            setValue('estimatedDuration', fetchedService.estimatedDuration || '');
            setValue('portfolioLink', fetchedService.portfolioLink || '');
            setValue('showPackagesSection', fetchedService.showPackagesSection || false);
            setValue('packages', fetchedService.packages || []);
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

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (!file && service) {
        setImagePreviewUrl(service.imageUrl);
        setValue('imageUrl', service.imageUrl); 
    }
  };

  const onSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    if (!service) return;
    startTransition(async () => {
      const formDataForAction = new FormData();
      
      // Handle file upload separately to get URL first
      if (selectedFile) {
        const blobFormData = new FormData();
        blobFormData.append('file', selectedFile);
        formDataForAction.append('imageFile', selectedFile);
      }
      
      formDataForAction.append('currentImageUrl', data.imageUrl || service.imageUrl || '');

      (Object.keys(data) as Array<keyof ServiceFormValues>).forEach(key => {
        if (key === 'packages' || key === 'faq') {
          const value = data[key] || [];
          formDataForAction.append(key, JSON.stringify(value));
        } else {
          const value = data[key];
          if (value !== undefined && value !== null && value !== '') {
             if (typeof value === 'number' || typeof value === 'boolean') {
                 formDataForAction.append(key, String(value));
            } else if (typeof value === 'string') {
                formDataForAction.append(key, value);
            }
          } else if (key === 'priceMin' || key === 'priceMax') {
             formDataForAction.append(key, '');
          }
        }
      });
      
      const result = await updateServiceAction(service.id, formDataForAction);

      if (result.error) {
         toast({
          title: 'Error Updating Service',
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: 'Service Updated Successfully',
          description: result.message || 'The service details have been updated.',
        });
        router.push('/admin/services'); 
      }
    });
  };

  const handleCancel = () => {
    router.push('/admin/services'); 
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Edit3 className="mr-3 h-8 w-8 text-primary" />
            Edit Service: {service.title} 
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" type="button" onClick={handleCancel} className="w-full sm:w-auto group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                Update Service 
            </Button>
          </div>
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
            isEditMode={true}
        />
      </div>
    </form>
  );
}
