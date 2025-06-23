'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { ArrowLeft, Save, Loader2, Home, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import { updateSitePageContentAction } from '@/lib/actions/sitePage.actions';
import type { HomePageContent } from '@/lib/types';
import NextImage from 'next/image';

const heroPageSchema = z.object({
  tagline: z.string().min(1, 'Tagline is required.'),
  subTagline: z.string().optional(),
  imageAiHint: z.string().max(50, "AI hint too long").optional(),
  ctaButtonText: z.string().optional(),
  ctaButtonLink: z.string().optional(),
});
type HeroPageFormValues = z.infer<typeof heroPageSchema>;

export default function EditHomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSaving, startSaveTransition] = useTransition();

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<HeroPageFormValues>({
    resolver: zodResolver(heroPageSchema),
  });
  
  useEffect(() => {
    setIsLoadingContent(true);
    getSitePageContent('home-page')
      .then((data) => {
        const pageData = data as HomePageContent;
        if (pageData) {
          reset({
            tagline: pageData.tagline,
            subTagline: pageData.subTagline,
            imageAiHint: pageData.imageAiHint,
            ctaButtonText: pageData.ctaButtonText,
            ctaButtonLink: pageData.ctaButtonLink,
          });
          setCurrentImageUrl(pageData.imageUrl || null);
          setImagePreview(pageData.imageUrl || null);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingContent(false));
  }, [reset]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFile) {
        objectUrl = URL.createObjectURL(selectedFile);
        setImagePreview(objectUrl);
    } else {
        setImagePreview(currentImageUrl || null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [selectedFile, currentImageUrl]);
  
  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  const onSubmit: SubmitHandler<HeroPageFormValues> = (data) => {
    startSaveTransition(async () => {
      const formDataForAction = new FormData();
      formDataForAction.append('tagline', data.tagline);
      formDataForAction.append('subTagline', data.subTagline || '');
      formDataForAction.append('imageAiHint', data.imageAiHint || '');
      formDataForAction.append('ctaButtonText', data.ctaButtonText || '');
      formDataForAction.append('ctaButtonLink', data.ctaButtonLink || '');

      if (selectedFile) {
        formDataForAction.append('heroImageFile', selectedFile);
      }
      if (currentImageUrl) {
        formDataForAction.append('currentImageUrl', currentImageUrl);
      }

      const result = await updateSitePageContentAction('home-page', formDataForAction);
      
      if (result.success) {
        toast({ title: 'Page Saved', description: 'Homepage Hero section has been updated.' });
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
          <Home className="mr-3 h-8 w-8 text-primary" />
          Edit Homepage Hero
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => router.push('/admin/pages')} className="group" disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pages
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Hero Content
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Hero Section Content</CardTitle>
          <CardDescription>Update the main content and call-to-action for the homepage hero section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" {...register('tagline')} className="mt-1" />
            {errors.tagline && <p className="text-sm text-destructive mt-1">{errors.tagline.message}</p>}
          </div>
          <div>
            <Label htmlFor="subTagline">Sub-Tagline (Optional)</Label>
            <Textarea id="subTagline" {...register('subTagline')} className="mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div>
                <Label htmlFor="ctaButtonText">CTA Button Text (Optional)</Label>
                <Input id="ctaButtonText" {...register('ctaButtonText')} className="mt-1" placeholder="e.g., Explore Services" />
            </div>
             <div>
                <Label htmlFor="ctaButtonLink">CTA Button Link (Optional)</Label>
                <Input id="ctaButtonLink" {...register('ctaButtonLink')} className="mt-1" placeholder="/services" />
            </div>
          </div>

          <div>
            <Label htmlFor="hero-image">Hero Image</Label>
            <CustomDropzone
              onFileChange={handleFileChange}
              currentFileName={selectedFile?.name || currentImageUrl?.split('/').pop()}
              accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.webp', '.avif'] }}
              maxSize={1 * 1024 * 1024}
              className="mt-1"
            />
            {imagePreview && (
              <div className="mt-4 p-3 border rounded-lg bg-muted/50 inline-block">
                <p className="text-xs text-muted-foreground mb-1.5">Image Preview:</p>
                <NextImage src={imagePreview} alt="Hero preview" width={200} height={150} className="rounded-md object-contain max-h-[150px]" />
              </div>
            )}
             {!imagePreview && (
               <div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs">
                  <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                  <p className="text-xs">No image set. Upload one.</p>
               </div>
             )}
          </div>
           <div>
            <Label htmlFor="imageAiHint">Image AI Hint (Optional, 1-2 words)</Label>
            <Input id="imageAiHint" {...register('imageAiHint')} className="mt-1" placeholder="e.g., modern technology" />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Hero Content
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
