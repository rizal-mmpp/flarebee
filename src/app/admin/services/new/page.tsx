
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceForm } from '@/components/sections/admin/ServiceForm'; // Updated import
import { type ServiceFormValues, serviceFormSchema } from '@/components/sections/admin/ServiceFormTypes'; // Updated import
import { saveServiceAction } from '@/lib/actions/service.actions'; // Updated import
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateServicePage() { // Renamed component
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm<ServiceFormValues>({ // Added watch
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
      let uploadedImageUrl = '';

      if (!selectedFile) {
        toast({
          title: 'Image Required',
          description: 'Please select an image for the service.', // Updated message
          variant: 'destructive',
        });
        return;
      }
      
      const blobFormData = new FormData();
      blobFormData.append('file', selectedFile);
      const uploadResult = await uploadFileToVercelBlob(blobFormData);

      if (!uploadResult.success || !uploadResult.data?.url) {
        toast({
          title: 'Image Upload Failed',
          description: uploadResult.error || 'Could not upload the service image.', // Updated message
          variant: 'destructive',
        });
        return;
      }
      uploadedImageUrl = uploadResult.data.url;

      const serviceActionFormData = new FormData(); // Renamed
      (Object.keys(data) as Array<keyof ServiceFormValues>).forEach(key => {
        const value = data[key];
        if (key === 'imageUrl') {
          // Skip, will be set explicitly
        } else if (value !== undefined && value !== null && value !== '') { // Ensure empty strings aren't sent if not intended
            if (typeof value === 'number' || typeof value === 'boolean') {
                 serviceActionFormData.append(key, String(value));
            } else if (typeof value === 'string') {
                serviceActionFormData.append(key, value);
            }
        } else if (key === 'priceMin' || key === 'priceMax') {
            // Allow null/undefined for optional price fields
            serviceActionFormData.append(key, ''); // Send empty string if not set
        }
      });
      serviceActionFormData.set('imageUrl', uploadedImageUrl); 
      
      const result = await saveServiceAction(serviceActionFormData); // Updated action call

      if (result.error) {
         toast({
          title: 'Error Saving Service', // Updated message
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: 'Service Saved Successfully', // Updated message
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
        <ServiceForm // Updated component
          control={control} 
          register={register} 
          errors={errors}
          watch={watch} // Pass watch
          currentImageUrl={imagePreviewUrl}
          onFileChange={handleFileChange}
          selectedFileName={selectedFile?.name}
          isEditMode={false}
        />
      </div>
    </form>
  );
}
