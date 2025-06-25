
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceForm } from '@/components/sections/admin/ServiceForm';
import { type ServiceFormValues, serviceFormSchema } from '@/components/sections/admin/ServiceFormTypes';
import { saveServiceAction } from '@/lib/actions/service.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';

export default function CreateServicePage() { 
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedFixedPriceImageFile, setSelectedFixedPriceImageFile] = useState<File | null>(null);
  const [fixedPriceImagePreviewUrl, setFixedPriceImagePreviewUrl] = useState<string | null>(null);


  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue, getValues } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      longDescription: '',
      categoryId: '',
      tags: '',
      imageUrl: '', 
      dataAiHint: '',
      status: 'draft',
      keyFeatures: '',
      targetAudience: '',
      estimatedDuration: '',
      portfolioLink: '',
      pricing: {
        isFixedPriceActive: false,
        isSubscriptionActive: true,
        isCustomQuoteActive: true,
        fixedPriceDetails: { bgClassName: 'bg-background', price: 0, title: 'One-Time Project', description: 'A single payment for a defined scope of work.', imageAiHint: '' },
        subscriptionDetails: { bgClassName: 'bg-card', packages: [] },
        customQuoteDetails: { bgClassName: 'bg-background', title: 'Still not sure?', text: "Tell us about your project, and we'll craft a custom package tailored just for you.", infoBoxText: '', formTitle: 'Describe Your Project', formDescription: 'The more details you provide, the better we can assist you.' },
      },
      showFaqSection: false,
      faq: [],
    }
  });

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFile) {
      objectUrl = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(objectUrl);
    } else {
      setImagePreviewUrl(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedFile]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFixedPriceImageFile) {
      objectUrl = URL.createObjectURL(selectedFixedPriceImageFile);
      setFixedPriceImagePreviewUrl(objectUrl);
    } else {
      setFixedPriceImagePreviewUrl(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFixedPriceImageFile]);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };
  
  const handleFixedPriceImageFileChange = (file: File | null) => {
    setSelectedFixedPriceImageFile(file);
  };


  const onSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    startTransition(async () => {
      const formDataForAction = new FormData();

      if (selectedFile) {
        formDataForAction.append('imageFile', selectedFile);
      } else {
         toast({
          title: 'Image Required',
          description: 'Please select a main image for the service.',
          variant: 'destructive',
        });
        return;
      }
      
      if (selectedFixedPriceImageFile) {
        formDataForAction.append('fixedPriceImageFile', selectedFixedPriceImageFile);
      }

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
      
      const result = await saveServiceAction(formDataForAction); 

      if (result.error) {
        const errorMessage = result.error;
        toast({
         title: 'Error Saving Service',
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
         duration: Infinity,
       });
      } else {
        toast({
          title: 'Service Saved Successfully',
          description: result.message || 'The service details have been processed.',
        });
        router.push('/admin/services'); 
        reset();
        setSelectedFile(null);
        setImagePreviewUrl(null);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Create New Service 
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto group">
              <Link href="/admin/services"> 
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Back to Services
              </Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Service
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
          currentFixedPriceImageUrl={fixedPriceImagePreviewUrl}
          onFixedPriceFileChange={handleFixedPriceImageFileChange}
          selectedFixedPriceFileName={selectedFixedPriceImageFile?.name}
          isEditMode={false}
        />
      </div>
    </form>
  );
}
