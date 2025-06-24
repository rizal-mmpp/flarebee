
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
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateServicePage() { 
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue, getValues } = useForm<ServiceFormValues>({
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
      showPackagesSection: false,
      packages: [],
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

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  const onSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    startTransition(async () => {
      const formDataForAction = new FormData();

      if (selectedFile) {
        formDataForAction.append('imageFile', selectedFile);
      } else {
         toast({
          title: 'Image Required',
          description: 'Please select an image for the service.',
          variant: 'destructive',
        });
        return;
      }
      
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
      
      const result = await saveServiceAction(formDataForAction); 

      if (result.error) {
         toast({
          title: 'Error Saving Service',
          description: result.error,
          variant: "destructive",
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
          isEditMode={false}
        />
      </div>
    </form>
  );
}
