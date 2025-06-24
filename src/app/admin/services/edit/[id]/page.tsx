
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceForm } from '@/components/sections/admin/ServiceForm'; // Updated import
import { type ServiceFormValues, serviceFormSchema } from '@/components/sections/admin/ServiceFormTypes'; // Updated import
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import { updateServiceAction } from '@/lib/actions/service.actions'; // Updated import
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
import type { Service } from '@/lib/types'; // Updated type
import { SERVICE_CATEGORIES, PRICING_MODELS, SERVICE_STATUSES } from '@/lib/constants'; // Updated constants
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, Edit3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditServicePage() { // Renamed component
  const router = useRouter();
  const params = useParams();
  const slug = params.id as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [service, setService] = useState<Service | null>(null); // Updated type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<ServiceFormValues>({ // Added watch
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      longDescription: '',
      categoryId: '',
      pricingModel: 'Custom Quote',
      priceMin: undefined,
      priceMax: undefined,
      currency: 'IDR',
      tags: '',
      imageUrl: '', 
      dataAiHint: '',
      status: 'draft',
      keyFeatures: '',
      targetAudience: '',
      estimatedDuration: '',
      portfolioLink: '',
    }
  });
  
  const watchedImageUrl = watch('imageUrl'); // Changed from previewImageUrl

  useEffect(() => {
    if (slug) {
      setIsLoading(true);
      setError(null);
      getServiceBySlugFromFirestore(slug)
        .then((fetchedService) => { // Updated variable name
          if (fetchedService) {
            setService(fetchedService);
            setValue('title', fetchedService.title);
            setValue('shortDescription', fetchedService.shortDescription || '');
            setValue('longDescription', fetchedService.longDescription || '');
            
            const isValidCategory = SERVICE_CATEGORIES.some(cat => cat.id === fetchedService.category.id);
            setValue('categoryId', isValidCategory ? fetchedService.category.id : ''); 
            
            const isValidPricingModel = PRICING_MODELS.includes(fetchedService.pricingModel);
            setValue('pricingModel', isValidPricingModel ? fetchedService.pricingModel : 'Custom Quote');

            setValue('priceMin', fetchedService.priceMin);
            setValue('priceMax', fetchedService.priceMax);
            setValue('currency', fetchedService.currency || 'IDR');
            setValue('tags', fetchedService.tags.join(', '));
            setValue('imageUrl', fetchedService.imageUrl); // Store existing URL in form state
            setImagePreviewUrl(fetchedService.imageUrl); // Set initial preview
            setValue('dataAiHint', fetchedService.dataAiHint || '');
            setValue('status', fetchedService.status || 'draft');
            setValue('keyFeatures', fetchedService.keyFeatures?.join(', ') || '');
            setValue('targetAudience', fetchedService.targetAudience?.join(', ') || '');
            setValue('estimatedDuration', fetchedService.estimatedDuration || '');
            setValue('portfolioLink', fetchedService.portfolioLink || '');

          } else {
            setError('Service not found.'); // Updated message
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service for editing:', err); // Updated message
          setError('Failed to load service data. Please try again.'); // Updated message
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
      let finalImageUrl = data.imageUrl || ''; 

      if (selectedFile) {
        const blobFormData = new FormData();
        blobFormData.append('file', selectedFile);
        const uploadResult = await uploadFileToVercelBlob(blobFormData);

        if (!uploadResult.success || !uploadResult.data?.url) {
          toast({
            title: 'Image Upload Failed',
            description: uploadResult.error || 'Could not upload the new service image.', // Updated message
            variant: 'destructive',
          });
          return;
        }
        finalImageUrl = uploadResult.data.url;
      } else if (!finalImageUrl && service.imageUrl) {
        finalImageUrl = service.imageUrl;
      }

      const serviceActionFormData = new FormData(); // Renamed
      (Object.keys(data) as Array<keyof ServiceFormValues>).forEach(key => {
        const value = data[key];
        if (key === 'imageUrl') {
          // Skip
        } else if (value !== undefined && value !== null && value !== '') {
             if (typeof value === 'number' || typeof value === 'boolean') {
                 serviceActionFormData.append(key, String(value));
            } else if (typeof value === 'string') {
                serviceActionFormData.append(key, value);
            }
        } else if (key === 'priceMin' || key === 'priceMax') {
             serviceActionFormData.append(key, ''); // Send empty string if not set or explicitly null
        }
      });
      serviceActionFormData.set('imageUrl', finalImageUrl);
      
      const result = await updateServiceAction(service.id, serviceActionFormData); // Updated action call

      if (result.error) {
         toast({
          title: 'Error Updating Service', // Updated message
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: 'Service Updated Successfully', // Updated message
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
        <p className="ml-4 text-muted-foreground">Loading service for editing...</p> {/* Updated message */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Service</h2> {/* Updated message */}
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
        <p className="text-muted-foreground mb-6">Service data could not be loaded or service does not exist.</p> {/* Updated message */}
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
            Edit Service: {service.title} {/* Updated message */}
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" type="button" onClick={handleCancel} className="w-full sm:w-auto group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Cancel & Back
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                Update Service 
            </Button>
          </div>
        </div>
        <ServiceForm // Updated component
            control={control} 
            register={register} 
            errors={errors}
            watch={watch} // Pass watch
            currentImageUrl={imagePreviewUrl}
            onFileChange={handleFileChange}
            selectedFileName={selectedFile?.name}
            isEditMode={true}
        />
      </div>
    </form>
  );
}
