'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { ArrowLeft, Save, Loader2, Contact, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import { updateSitePageContentAction } from '@/lib/actions/sitePage.actions';
import type { ContactPageContent } from '@/lib/types';
import NextImage from 'next/image';

const contactPageSchema = z.object({
  contactPageImageFile: z.instanceof(File).optional().nullable(),
  currentImageUrl: z.string().optional().nullable(), // For carrying over the existing URL
});

type ContactPageFormValues = z.infer<typeof contactPageSchema>;

export default function EditContactUsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSaving, startSaveTransition] = useTransition();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { handleSubmit, setValue, watch } = useForm<ContactPageFormValues>({
    resolver: zodResolver(contactPageSchema),
  });

  const currentImageUrlValue = watch('currentImageUrl');

  useEffect(() => {
    setIsLoadingContent(true);
    getSitePageContent('contact-us')
      .then((data) => {
        const pageData = data as ContactPageContent;
        if (pageData) {
          setValue('currentImageUrl', pageData.imageUrl);
          setImagePreview(pageData.imageUrl || null);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingContent(false));
  }, [setValue]);
  
  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFile) {
        objectUrl = URL.createObjectURL(selectedFile);
        setImagePreview(objectUrl);
    } else {
        setImagePreview(currentImageUrlValue || null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [selectedFile, currentImageUrlValue]);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setValue('contactPageImageFile', file);
  };
  
  const onSubmit: SubmitHandler<ContactPageFormValues> = (data) => {
    startSaveTransition(async () => {
      const formDataForAction = new FormData();
      if (data.contactPageImageFile) {
        formDataForAction.append('contactPageImageFile', data.contactPageImageFile);
      }
      if (data.currentImageUrl) {
        formDataForAction.append('currentImageUrl', data.currentImageUrl);
      }

      const result = await updateSitePageContentAction('contact-us', formDataForAction);
      
      if (result.success) {
        toast({ title: 'Page Saved', description: 'Contact Us page image has been updated.' });
        router.push('/admin/pages');
      } else {
        toast({ title: 'Error Saving', description: result.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    });
  };

  if (isLoadingContent) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading page content...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Contact className="mr-3 h-8 w-8 text-primary" />
          Edit Contact Us Page
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => router.push('/admin/pages')} className="group" disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pages
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Image
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Page Image</CardTitle>
          <CardDescription>Update the primary image displayed on the public "Contact Us" page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="contact-image">Contact Page Image</Label>
            <CustomDropzone
              onFileChange={handleFileChange}
              currentFileName={selectedFile?.name}
              accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.webp'] }}
              maxSize={1 * 1024 * 1024}
              className="mt-1"
            />
            {imagePreview && (
              <div className="mt-4 p-3 border rounded-lg bg-muted/50 inline-block">
                <p className="text-xs text-muted-foreground mb-1.5">Image Preview:</p>
                <NextImage src={imagePreview} alt="Contact page preview" width={200} height={150} className="rounded-md object-contain max-h-[150px]" />
              </div>
            )}
             {!imagePreview && !selectedFile && (
               <div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs">
                  <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                  <p className="text-xs">No image set. Upload a new one.</p>
               </div>
             )}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Image
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}