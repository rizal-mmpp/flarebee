
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceForm } from '@/components/sections/admin/ServiceForm'; 
import { type ServiceFormValues, serviceFormSchema } from '@/components/sections/admin/ServiceFormTypes'; 
import { getServiceFromErpNextByName, updateServiceInErpNext } from '@/lib/actions/erpnext/item.actions'; 
import type { Service } from '@/lib/types'; 
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, Edit3, ArrowLeft, Save, Rocket, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceName = params.id as string;
  const { toast } = useToast();
  const { erpSid } = useCombinedAuth();
  const [isPending, startTransition] = useTransition();

  const [service, setService] = useState<Service | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch, getValues } = useForm<ServiceFormValues>({ 
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      status: 'active',
    }
  });

  useEffect(() => {
    if (serviceName && erpSid) {
      setIsLoading(true);
      setError(null);
      getServiceFromErpNextByName({ sid: erpSid, serviceName })
        .then((result) => { 
          if (result.success && result.data) {
            const fetchedService = result.data;
            setService(fetchedService);
            
            setValue('title', fetchedService.title);
            setValue('shortDescription', fetchedService.shortDescription || '');
            setValue('longDescription', fetchedService.longDescription || '');
            setValue('categoryId', fetchedService.category.id);
            setValue('tags', fetchedService.tags.join(', '));
            setValue('imageUrl', fetchedService.imageUrl);
            setValue('status', fetchedService.status || 'draft');
            setValue('serviceUrl', fetchedService.serviceUrl || '');

          } else {
            setError(result.error || 'Service not found.'); 
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
  }, [serviceName, setValue, erpSid]);


  const onSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    if (!service || !erpSid) {
        toast({ title: "Error", description: "Cannot update service without required context.", variant: "destructive" });
        return;
    }
    startTransition(async () => {
      const result = await updateServiceInErpNext({
        sid: erpSid,
        serviceName: service.id,
        serviceData: data,
      });

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
          duration: 15000, 
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
            <span className="truncate" title={service.title}>Edit Service: {service.title}</span>
          </h1>
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center justify-start sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" type="button" onClick={handleCancel} disabled={isPending}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Cancel</span></Button></TooltipTrigger><TooltipContent><p>Cancel & Go Back</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button asChild variant="outline" size="icon" type="button" disabled={isPending}><Link href={`/admin/services/${service.id}/simulate-journey`}><Rocket className="h-4 w-4" /><span className="sr-only">Customer Journey</span></Link></Button></TooltipTrigger><TooltipContent><p>Customer Journey</p></TooltipContent></Tooltip>
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
            onFileChange={() => {}} // No-op for edit, as URL is set directly
            isEditMode={true}
        />
      </div>
    </form>
  );
}
