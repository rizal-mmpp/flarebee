
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TemplateUploadForm } from '@/components/sections/admin/TemplateUploadForm';
import { type TemplateFormValues, templateFormSchema } from '@/components/sections/admin/TemplateFormTypes';
import { getTemplateByIdFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { updateTemplateAction } from '@/lib/actions/template.actions';
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      categoryId: '',
      price: 0,
      tags: '',
      techStack: '',
      previewImageUrl: '', // Will be populated by Vercel Blob URL or existing
      dataAiHint: '',
      previewUrl: '',
      downloadZipUrl: '#',
      githubUrl: '',
    }
  });
  
  // Watch the previewImageUrl from react-hook-form state (stores existing URL)
  const watchedImageUrl = watch('previewImageUrl');

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
            setValue('previewImageUrl', fetchedTemplate.imageUrl); // Store existing URL in form state
            setImagePreviewUrl(fetchedTemplate.imageUrl); // Set initial preview
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

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFile) {
      objectUrl = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(objectUrl);
    } else if (watchedImageUrl) { // If no new file, show existing/watched URL
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
    if (!file && template) {
        // If file is cleared, revert preview to original template image URL
        setImagePreviewUrl(template.imageUrl);
        setValue('previewImageUrl', template.imageUrl); // also update form state
    }
  };

  const onSubmit: SubmitHandler<TemplateFormValues> = (data) => {
    if (!template) return;
    startTransition(async () => {
      let finalImageUrl = data.previewImageUrl || ''; // Start with existing or form value

      if (selectedFile) {
        const blobFormData = new FormData();
        blobFormData.append('file', selectedFile);
        const uploadResult = await uploadFileToVercelBlob(blobFormData);

        if (!uploadResult.success || !uploadResult.data?.url) {
          toast({
            title: 'Image Upload Failed',
            description: uploadResult.error || 'Could not upload the new preview image.',
            variant: 'destructive',
          });
          return;
        }
        finalImageUrl = uploadResult.data.url;
      } else if (!finalImageUrl && template.imageUrl) {
        // This case handles if the form's previewImageUrl was cleared but no new file selected,
        // revert to original template image URL
        finalImageUrl = template.imageUrl;
      }


      const templateActionFormData = new FormData();
      (Object.keys(data) as Array<keyof TemplateFormValues>).forEach(key => {
        const value = data[key];
        if (key === 'previewImageUrl') {
          // Skip here, will be set explicitly with finalImageUrl
        } else if (value !== undefined && value !== null) {
          templateActionFormData.append(key, String(value));
        } else if (key === 'downloadZipUrl') {
            templateActionFormData.append(key, '#');
        }
      });
      templateActionFormData.set('previewImageUrl', finalImageUrl);
      
      const result = await updateTemplateAction(template.id, templateActionFormData);

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
        router.push('/admin/templates'); // Changed to go to template list
      }
    });
  };

  const handleCancel = () => {
    router.push('/admin/templates'); // Changed to go to template list
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
          <Link href="/admin/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
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
          <Link href="/admin/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
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
            Edit Template: {template.title}
          </h1>
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
        <TemplateUploadForm 
            control={control} 
            register={register} 
            errors={errors}
            currentImageUrl={imagePreviewUrl} // Pass the state for preview
            onFileChange={handleFileChange}
            selectedFileName={selectedFile?.name}
        />
      </div>
    </form>
  );
}
