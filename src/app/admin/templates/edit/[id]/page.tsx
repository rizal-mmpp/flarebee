
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TemplateUploadForm } from '@/components/sections/admin/TemplateUploadForm';
import { type TemplateFormValues, templateFormSchema } from '@/components/sections/admin/TemplateFormTypes';
import { getTemplateByIdFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { updateTemplateAction } from '@/lib/actions/template.actions';
import type { Template } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, Edit3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      categoryId: '',
      price: 0,
      tags: '',
      techStack: '',
      previewImageUrl: '',
      dataAiHint: '',
      previewUrl: '',
      downloadZipUrl: '#',
      githubUrl: '',
    }
  });

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setError(null);
      getTemplateByIdFromFirestore(id)
        .then((fetchedTemplate) => {
          if (fetchedTemplate) {
            setTemplate(fetchedTemplate);
            setValue('title', fetchedTemplate.title);
            setValue('description', fetchedTemplate.description);
            setValue('longDescription', fetchedTemplate.longDescription || '');
            const isValidCategory = CATEGORIES.some(cat => cat.id === fetchedTemplate.category.id);
            setValue('categoryId', isValidCategory ? fetchedTemplate.category.id : ''); 
            setValue('price', fetchedTemplate.price);
            setValue('tags', fetchedTemplate.tags.join(', '));
            setValue('techStack', fetchedTemplate.techStack?.join(', ') || '');
            setValue('previewImageUrl', fetchedTemplate.imageUrl);
            setValue('dataAiHint', fetchedTemplate.dataAiHint || '');
            setValue('previewUrl', fetchedTemplate.previewUrl || '');
            setValue('downloadZipUrl', fetchedTemplate.downloadZipUrl || '#');
            setValue('githubUrl', fetchedTemplate.githubUrl || '');
          } else {
            setError('Template not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch template for editing:', err);
          setError('Failed to load template data. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, setValue]);

  const onSubmit: SubmitHandler<TemplateFormValues> = (data) => {
    if (!template) return;
    startTransition(async () => {
      const formData = new FormData();
      (Object.keys(data) as Array<keyof TemplateFormValues>).forEach(key => {
        const value = data[key];
         if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        } else if (key === 'downloadZipUrl') {
            formData.append(key, '#');
        }
      });
      
      const result = await updateTemplateAction(template.id, formData);

      if (result.error) {
         toast({
          title: 'Error Updating Template',
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: 'Template Updated Successfully',
          description: result.message || 'The template details have been updated.',
        });
        router.push('/admin/dashboard');
      }
    });
  };

  const handleCancel = () => {
    router.push('/admin/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading template for editing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Template</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!template) {
     return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-6">Template data could not be loaded or template does not exist.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Edit3 className="mr-3 h-8 w-8 text-primary" />
            Edit Template: <span className="ml-2 font-normal text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">{template.title}</span>
          </h1>
          {/* Action Buttons Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" type="button" onClick={handleCancel} className="w-full sm:w-auto group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Cancel & Back
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                Update Template
            </Button>
          </div>
        </div>
        {/* Form Component */}
        <TemplateUploadForm control={control} register={register} errors={errors} />
      </div>
    </form>
  );
}
