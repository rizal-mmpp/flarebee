
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TemplateUploadForm } from '@/components/sections/admin/TemplateUploadForm';
import { type TemplateFormValues, templateFormSchema } from '@/components/sections/admin/TemplateFormTypes';
import { saveTemplateAction } from '@/lib/actions/template.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

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
      previewImageUrl: '',
      dataAiHint: '',
      previewUrl: '',
      downloadZipUrl: '#',
      githubUrl: '',
    }
  });

  const onSubmit: SubmitHandler<TemplateFormValues> = (data) => {
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
      
      const result = await saveTemplateAction(formData);

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
        router.push('/admin/dashboard');
        reset();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Create New Template
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="group">
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Back to Dashboard
              </Link>
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Template
            </Button>
          </div>
        </div>
        <TemplateUploadForm control={control} register={register} errors={errors} />
      </div>
    </form>
  );
}
