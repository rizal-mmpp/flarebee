
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TemplateUploadForm } from '@/components/sections/admin/TemplateUploadForm';
import { type TemplateFormValues, templateFormSchema } from '@/components/sections/admin/TemplateFormTypes';
import { saveTemplateAction } from '@/lib/actions/template.actions';
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      categoryId: '',
      price: 0,
      tags: '',
      techStack: '',
      previewImageUrl: '', // Will be populated by Vercel Blob URL
      dataAiHint: '',
      previewUrl: '',
      downloadZipUrl: '#',
      githubUrl: '',
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

  const onSubmit: SubmitHandler<TemplateFormValues> = (data) => {
    startTransition(async () => {
      let uploadedImageUrl = '';

      if (!selectedFile) {
        toast({
          title: 'Image Required',
          description: 'Please select a preview image for the template.',
          variant: 'destructive',
        });
        return;
      }
      
      // Upload to Vercel Blob first
      const blobFormData = new FormData();
      blobFormData.append('file', selectedFile);
      const uploadResult = await uploadFileToVercelBlob(blobFormData);

      if (!uploadResult.success || !uploadResult.data?.url) {
        toast({
          title: 'Image Upload Failed',
          description: uploadResult.error || 'Could not upload the preview image.',
          variant: 'destructive',
        });
        return;
      }
      uploadedImageUrl = uploadResult.data.url;

      // Prepare form data for saveTemplateAction
      const templateActionFormData = new FormData();
      (Object.keys(data) as Array<keyof TemplateFormValues>).forEach(key => {
        const value = data[key];
         if (key === 'previewImageUrl') { // This key is now specifically for the URL
          // Skip, as we will set it explicitly with the Vercel Blob URL
        } else if (value !== undefined && value !== null) {
          templateActionFormData.append(key, String(value));
        } else if (key === 'downloadZipUrl') {
           templateActionFormData.append(key, '#'); // Default if null/undefined
        }
      });
      templateActionFormData.set('previewImageUrl', uploadedImageUrl); // Set the uploaded image URL
      
      const result = await saveTemplateAction(templateActionFormData);

      if (result.error) {
         toast({
          title: 'Error Saving Template',
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: 'Template Saved Successfully',
          description: result.message || 'The template details have been processed.',
        });
        router.push('/admin/templates'); // Changed from /admin/dashboard to go to template list
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
            Create New Template
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto group">
              <Link href="/admin/templates"> {/* Changed from /admin/dashboard */}
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Back to Templates
              </Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Template
            </Button>
          </div>
        </div>
        <TemplateUploadForm 
          control={control} 
          register={register} 
          errors={errors}
          currentImageUrl={imagePreviewUrl}
          onFileChange={handleFileChange}
          selectedFileName={selectedFile?.name}
        />
      </div>
    </form>
  );
}
