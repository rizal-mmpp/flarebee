
'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import NextImage from 'next/image';
import { ArrowLeft, Save, Loader2, Settings, Info, Users, Briefcase, Sparkles, MessageCircle, Building, ListChecks, PlusCircle, Trash2, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import { updateSitePageContentAction } from '@/lib/actions/sitePage.actions';
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
import type { PublicAboutPageContent, PublicAboutPageServiceItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';


const serviceItemSchema = z.object({
  id: z.string().min(1, 'Service item ID is required'),
  icon: z.string().min(1, 'Icon name (Lucide) is required'),
  name: z.string().min(1, 'Service item name is required'),
  description: z.string().min(1, 'Service item description is required'),
});

const pageSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().min(1, 'Text is required'),
  imageUrl: z.string().url('Must be a valid URL or empty string.').optional().nullable(),
  imageAiHint: z.string().max(50, "AI hint too long").optional(),
  imageFile: z.instanceof(File).optional().nullable(),
});

const publicAboutPageSchema = z.object({
  pageTitle: z.string().min(1, 'Page title is required.'),
  heroSection: z.object({
    tagline: z.string().min(1, 'Tagline is required.'),
    subTagline: z.string().optional(),
    imageUrl: z.string().url('Must be a valid URL or empty string.').optional().nullable(),
    imageAiHint: z.string().max(50, "AI hint too long").optional(),
    imageFile: z.instanceof(File).optional().nullable(),
    ctaButtonText: z.string().optional(),
    ctaButtonLink: z.string().url('Must be a valid URL or empty').or(z.literal('')).optional(),
  }),
  showHistorySection: z.boolean().optional().default(true),
  historySection: pageSectionSchema,
  showFounderSection: z.boolean().optional().default(true),
  founderSection: z.object({
    name: z.string().min(1, 'Founder name is required.'),
    title: z.string().min(1, 'Founder title is required.'),
    bio: z.string().min(1, 'Founder bio is required.'),
    imageUrl: z.string().url('Must be a valid URL or empty string.').optional().nullable(),
    imageAiHint: z.string().max(50, "AI hint too long").optional(),
    imageFile: z.instanceof(File).optional().nullable(),
  }),
  showMissionVisionSection: z.boolean().optional().default(true),
  missionVisionSection: z.object({
    missionTitle: z.string().optional(),
    missionText: z.string().optional(),
    visionTitle: z.string().optional(),
    visionText: z.string().optional(),
  }).optional(),
  showServicesIntroSection: z.boolean().optional().default(true),
  servicesIntroSection: z.object({
    title: z.string().min(1, 'Services intro title is required'),
    introText: z.string().min(1, 'Services intro text is required'),
  }).optional(),
  servicesHighlights: z.array(serviceItemSchema).optional(),
  showCompanyOverviewSection: z.boolean().optional().default(true),
  companyOverviewSection: pageSectionSchema,
  showCallToActionSection: z.boolean().optional().default(true),
  callToActionSection: z.object({
    title: z.string().min(1, 'CTA title is required'),
    text: z.string().min(1, 'CTA text is required'),
    buttonText: z.string().min(1, 'CTA button text is required'),
    buttonLink: z.string().url({ message: "CTA button link must be a valid URL." }).min(1, 'CTA button link is required'),
  }),
});

type PublicAboutFormValues = z.infer<typeof publicAboutPageSchema>;

export default function EditPublicAboutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSaving, startSaveTransition] = useTransition();

  const [selectedHeroImageFile, setSelectedHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [selectedHistoryImageFile, setSelectedHistoryImageFile] = useState<File | null>(null);
  const [historyImagePreview, setHistoryImagePreview] = useState<string | null>(null);
  const [selectedFounderImageFile, setSelectedFounderImageFile] = useState<File | null>(null);
  const [founderImagePreview, setFounderImagePreview] = useState<string | null>(null);
  const [selectedCompanyOverviewImageFile, setSelectedCompanyOverviewImageFile] = useState<File | null>(null);
  const [companyOverviewImagePreview, setCompanyOverviewImagePreview] = useState<string | null>(null);

  const { control, register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<PublicAboutFormValues>({
    resolver: zodResolver(publicAboutPageSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "servicesHighlights",
  });
  
  const MAX_FILE_SIZE_BYTES = 0.95 * 1024 * 1024;

  useEffect(() => {
    setIsLoadingContent(true);
    getSitePageContent('public-about')
      .then((data) => {
        if (data && data.id === 'public-about') {
          const content = data as PublicAboutPageContent;
          reset({
            pageTitle: content.pageTitle,
            heroSection: { ...content.heroSection, imageFile: null },
            showHistorySection: content.showHistorySection !== undefined ? content.showHistorySection : true,
            historySection: { ...content.historySection, imageFile: null },
            showFounderSection: content.showFounderSection !== undefined ? content.showFounderSection : true,
            founderSection: { ...content.founderSection, imageFile: null },
            showMissionVisionSection: content.showMissionVisionSection !== undefined ? content.showMissionVisionSection : true,
            missionVisionSection: content.missionVisionSection || { missionTitle: '', missionText: '', visionTitle: '', visionText: '' },
            showServicesIntroSection: content.showServicesIntroSection !== undefined ? content.showServicesIntroSection : true,
            servicesIntroSection: content.servicesIntroSection || { title: '', introText: ''},
            servicesHighlights: content.servicesHighlights || [],
            showCompanyOverviewSection: content.showCompanyOverviewSection !== undefined ? content.showCompanyOverviewSection : true,
            companyOverviewSection: { ...content.companyOverviewSection, imageFile: null },
            showCallToActionSection: content.showCallToActionSection !== undefined ? content.showCallToActionSection : true,
            callToActionSection: content.callToActionSection,
          });
          setHeroImagePreview(content.heroSection.imageUrl || null);
          setHistoryImagePreview(content.historySection.imageUrl || null);
          setFounderImagePreview(content.founderSection.imageUrl || null);
          setCompanyOverviewImagePreview(content.companyOverviewSection.imageUrl || null);
        } else {
          toast({ title: 'Data Error', description: 'Failed to load specific page data, defaults may be shown.', variant: 'destructive' });
        }
      })
      .catch((err) => {
        console.error("Error fetching public-about page content:", err);
        toast({ title: 'Error Loading Data', description: 'Could not load page content. Please try again.', variant: 'destructive' });
      })
      .finally(() => {
        setIsLoadingContent(false);
      });
  }, [reset, toast]);

  // Image Preview Effect Hooks
  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedHeroImageFile) {
      objectUrl = URL.createObjectURL(selectedHeroImageFile);
      setHeroImagePreview(objectUrl);
    } else {
      setHeroImagePreview(watch('heroSection.imageUrl') || null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [selectedHeroImageFile, watch('heroSection.imageUrl')]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedHistoryImageFile) {
      objectUrl = URL.createObjectURL(selectedHistoryImageFile);
      setHistoryImagePreview(objectUrl);
    } else {
      setHistoryImagePreview(watch('historySection.imageUrl') || null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [selectedHistoryImageFile, watch('historySection.imageUrl')]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFounderImageFile) {
      objectUrl = URL.createObjectURL(selectedFounderImageFile);
      setFounderImagePreview(objectUrl);
    } else {
      setFounderImagePreview(watch('founderSection.imageUrl') || null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [selectedFounderImageFile, watch('founderSection.imageUrl')]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedCompanyOverviewImageFile) {
      objectUrl = URL.createObjectURL(selectedCompanyOverviewImageFile);
      setCompanyOverviewImagePreview(objectUrl);
    } else {
      setCompanyOverviewImagePreview(watch('companyOverviewSection.imageUrl') || null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [selectedCompanyOverviewImageFile, watch('companyOverviewSection.imageUrl')]);

  // File Change Handlers
  const handleHeroImageFileChange = useCallback((file: File | null) => {
    setSelectedHeroImageFile(file);
    setValue('heroSection.imageFile', file, { shouldValidate: true });
  }, [setValue]);
  const handleHistoryImageFileChange = useCallback((file: File | null) => {
    setSelectedHistoryImageFile(file);
    setValue('historySection.imageFile', file, { shouldValidate: true });
  }, [setValue]);
  const handleFounderImageFileChange = useCallback((file: File | null) => {
    setSelectedFounderImageFile(file);
    setValue('founderSection.imageFile', file, { shouldValidate: true });
  }, [setValue]);
  const handleCompanyOverviewImageFileChange = useCallback((file: File | null) => {
    setSelectedCompanyOverviewImageFile(file);
    setValue('companyOverviewSection.imageFile', file, { shouldValidate: true });
  }, [setValue]);


  const onSubmit: SubmitHandler<PublicAboutFormValues> = async (formDataFromHook) => {
    startSaveTransition(async () => {
      const pageDataForAction: PublicAboutPageContent = JSON.parse(JSON.stringify(formDataFromHook)); // Deep clone
      
      // Helper function to upload image if a new one is selected
      const uploadImage = async (file: File | null | undefined, currentUrl: string | null | undefined): Promise<string | null | undefined> => {
        if (file) {
          const blobFormData = new FormData();
          blobFormData.append('file', file);
          const uploadResult = await uploadFileToVercelBlob(blobFormData);
          if (uploadResult.success && uploadResult.data?.url) {
            return uploadResult.data.url;
          } else {
            toast({ title: 'Image Upload Failed', description: `Could not upload ${file.name}. ${uploadResult.error}`, variant: 'destructive' });
            throw new Error(`Upload failed for ${file.name}`); // Throw to stop submission
          }
        }
        return currentUrl; // Return current URL if no new file
      };

      try {
        pageDataForAction.heroSection.imageUrl = await uploadImage(formDataFromHook.heroSection.imageFile, formDataFromHook.heroSection.imageUrl);
        pageDataForAction.historySection.imageUrl = await uploadImage(formDataFromHook.historySection.imageFile, formDataFromHook.historySection.imageUrl);
        pageDataForAction.founderSection.imageUrl = await uploadImage(formDataFromHook.founderSection.imageFile, formDataFromHook.founderSection.imageUrl);
        pageDataForAction.companyOverviewSection.imageUrl = await uploadImage(formDataFromHook.companyOverviewSection.imageFile, formDataFromHook.companyOverviewSection.imageUrl);
      } catch (uploadError: any) {
        // Error already toasted by uploadImage helper
        console.error("Image upload process failed:", uploadError);
        return; // Stop form submission
      }
      
      // Clean up imageFile properties as they are not part of PublicAboutPageContent type for Firestore
      delete (pageDataForAction.heroSection as any).imageFile;
      delete (pageDataForAction.historySection as any).imageFile;
      delete (pageDataForAction.founderSection as any).imageFile;
      delete (pageDataForAction.companyOverviewSection as any).imageFile;

      // Ensure optional sections are correctly structured
      pageDataForAction.missionVisionSection = formDataFromHook.missionVisionSection && (formDataFromHook.missionVisionSection.missionText || formDataFromHook.missionVisionSection.visionText) ? formDataFromHook.missionVisionSection : undefined;
      pageDataForAction.servicesIntroSection = formDataFromHook.servicesIntroSection && formDataFromHook.servicesIntroSection.title ? formDataFromHook.servicesIntroSection : undefined;
      pageDataForAction.servicesHighlights = formDataFromHook.servicesHighlights && formDataFromHook.servicesHighlights.length > 0 ? formDataFromHook.servicesHighlights : undefined;


      const formDataForAction = new FormData();
      formDataForAction.append('pageDataJson', JSON.stringify(pageDataForAction));
      
      const result = await updateSitePageContentAction('public-about', formDataForAction);
      if (result.success) {
        toast({ title: 'Page Saved', description: 'Public About Us page has been updated successfully.' });
        // Reset file states after successful save
        setSelectedHeroImageFile(null);
        setSelectedHistoryImageFile(null);
        setSelectedFounderImageFile(null);
        setSelectedCompanyOverviewImageFile(null);
        // Re-fetch or re-reset form to show newly saved URLs if needed
        // For now, router.push will cause a reload anyway if it navigates.
        // If staying on the page, a manual re-sync of image previews to new URLs might be good.
        router.push('/admin/pages');
      } else {
        toast({ title: 'Error Saving Page', description: result.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    });
  };
  
  interface SectionCardProps {
    title: string;
    description?: string;
    icon?: React.ElementType;
    children: React.ReactNode;
    cardClassName?: string;
    showSectionToggleName?: keyof PublicAboutFormValues;
  }

  const SectionCard: React.FC<SectionCardProps> = 
    ({title, description, icon: Icon, children, cardClassName, showSectionToggleName}) => (
    <Card className={cardClassName}>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-xl flex items-center">
                        {Icon && <Icon className="mr-3 h-6 w-6 text-primary" />}
                        {title}
                    </CardTitle>
                    {description && <CardDescription className="mt-1">{description}</CardDescription>}
                </div>
                {showSectionToggleName && (
                    <Controller
                        name={showSectionToggleName as any} 
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`toggle-${showSectionToggleName}`}
                                    checked={field.value as boolean | undefined}
                                    onCheckedChange={field.onChange}
                                />
                                <Label htmlFor={`toggle-${showSectionToggleName}`} className="text-xs text-muted-foreground">
                                    {(field.value as boolean | undefined) ? "Visible" : "Hidden"}
                                </Label>
                            </div>
                        )}
                    />
                )}
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {children}
        </CardContent>
    </Card>
  );

  const ImageFieldSection: React.FC<{
    sectionName: 'heroSection' | 'historySection' | 'founderSection' | 'companyOverviewSection';
    label: string;
    imagePreviewUrl: string | null;
    onFileChange: (file: File | null) => void;
    selectedFileName: string | null | undefined;
    aiHintName: string;
    maxSize?: number;
  }> = ({ sectionName, label, imagePreviewUrl, onFileChange, selectedFileName, aiHintName, maxSize }) => (
    <>
      <div>
        <Label htmlFor={`${sectionName}.imageFile`}>{label} Image (Optional)</Label>
        <CustomDropzone
          onFileChange={onFileChange}
          currentFileName={selectedFileName}
          accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.webp', '.avif'] }}
          maxSize={maxSize || MAX_FILE_SIZE_BYTES}
          className="mt-1"
        />
        {/* @ts-ignore */}
        {errors[sectionName]?.imageFile && <p className="text-sm text-destructive mt-1">{errors[sectionName]?.imageFile?.message}</p>}
        {/* @ts-ignore */}
        {errors[sectionName]?.imageUrl && <p className="text-sm text-destructive mt-1">{errors[sectionName]?.imageUrl?.message}</p>}

        {imagePreviewUrl && (
          <div className="mt-3 p-2 border border-border rounded-lg bg-muted/50 max-w-xs">
            <p className="text-xs text-muted-foreground mb-1">Image Preview:</p>
            <NextImage
              src={imagePreviewUrl}
              alt={`${label} preview`}
              width={200}
              height={120}
              className="rounded-md object-contain max-h-[120px]"
            />
          </div>
        )}
        {!imagePreviewUrl && !selectedFileName && (
            <div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs">
                <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                <p className="text-xs">Upload an image or leave blank.</p>
            </div>
        )}
      </div>
      <div>
        <Label htmlFor={aiHintName as string}>Image AI Hint (Optional, 1-2 words)</Label>
        <Input id={aiHintName as string} {...register(aiHintName as any)} className="mt-1" placeholder="e.g., modern technology" />
      </div>
    </>
  );


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
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
          <Settings className="mr-3 h-7 w-7 text-primary" />
          Edit Public About Us Page
        </h1>
        <div className="flex gap-3 flex-col sm:flex-row w-full md:w-auto">
          <Button variant="outline" type="button" onClick={() => router.push('/admin/pages')} className="group" disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save About Page
          </Button>
        </div>
      </header>

      <SectionCard title="Page Meta & Hero Section" icon={Info} description="Define the main title and hero section for the About Us page.">
        <div>
          <Label htmlFor="pageTitle">Page Title (for browser tab & main heading)</Label>
          <Input id="pageTitle" {...register('pageTitle')} className="mt-1" placeholder="e.g., About Ragam Inovasi Optima" />
          {errors.pageTitle && <p className="text-sm text-destructive mt-1">{errors.pageTitle.message}</p>}
        </div>
        <Separator />
        <h3 className="text-lg font-medium">Hero Content</h3>
        <div>
          <Label htmlFor="heroSection.tagline">Hero Tagline</Label>
          <Input id="heroSection.tagline" {...register('heroSection.tagline')} className="mt-1" placeholder="e.g., Turning Technology Into Your Superpower."/>
          {errors.heroSection?.tagline && <p className="text-sm text-destructive mt-1">{errors.heroSection.tagline.message}</p>}
        </div>
         <div>
          <Label htmlFor="heroSection.subTagline">Hero Sub-Tagline (Optional)</Label>
          <Textarea id="heroSection.subTagline" {...register('heroSection.subTagline')} className="mt-1" rows={2} placeholder="A brief sentence expanding on the tagline."/>
        </div>
        <ImageFieldSection
            sectionName="heroSection"
            label="Hero"
            imagePreviewUrl={heroImagePreview}
            onFileChange={handleHeroImageFileChange}
            selectedFileName={selectedHeroImageFile?.name}
            aiHintName="heroSection.imageAiHint"
        />
        <div>
          <Label htmlFor="heroSection.ctaButtonText">Hero CTA Button Text (Optional)</Label>
          <Input id="heroSection.ctaButtonText" {...register('heroSection.ctaButtonText')} className="mt-1" placeholder="e.g., Explore Our Services" />
        </div>
        <div>
          <Label htmlFor="heroSection.ctaButtonLink">Hero CTA Button Link (Optional, requires button text)</Label>
          <Input id="heroSection.ctaButtonLink" {...register('heroSection.ctaButtonLink')} className="mt-1" placeholder="e.g., /services or /#services" />
           {errors.heroSection?.ctaButtonLink && <p className="text-sm text-destructive mt-1">{errors.heroSection.ctaButtonLink.message}</p>}
        </div>
      </SectionCard>
      
      <SectionCard title="History Section" icon={ListChecks} showSectionToggleName="showHistorySection">
        <div>
          <Label htmlFor="historySection.title">Section Title</Label>
          <Input id="historySection.title" {...register('historySection.title')} className="mt-1" placeholder="e.g., Our Journey & Commitment"/>
          {errors.historySection?.title && <p className="text-sm text-destructive mt-1">{errors.historySection.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="historySection.text">Text Content</Label>
          <Textarea id="historySection.text" {...register('historySection.text')} rows={5} className="mt-1" placeholder="Tell your company's story, mention Ditjen AHU registration."/>
          {errors.historySection?.text && <p className="text-sm text-destructive mt-1">{errors.historySection.text.message}</p>}
        </div>
        <ImageFieldSection
            sectionName="historySection"
            label="History"
            imagePreviewUrl={historyImagePreview}
            onFileChange={handleHistoryImageFileChange}
            selectedFileName={selectedHistoryImageFile?.name}
            aiHintName="historySection.imageAiHint"
        />
      </SectionCard>

      <SectionCard title="Founder Section" icon={Users} showSectionToggleName="showFounderSection">
        <div><Label htmlFor="founderSection.name">Founder Name</Label><Input id="founderSection.name" {...register('founderSection.name')} className="mt-1" placeholder="Rizal Iswandy"/>
        {errors.founderSection?.name && <p className="text-sm text-destructive mt-1">{errors.founderSection.name.message}</p>}</div>
        <div><Label htmlFor="founderSection.title">Founder Title</Label><Input id="founderSection.title" {...register('founderSection.title')} className="mt-1" placeholder="e.g., Founder & Lead Innovator"/>
        {errors.founderSection?.title && <p className="text-sm text-destructive mt-1">{errors.founderSection.title.message}</p>}</div>
        <div><Label htmlFor="founderSection.bio">Founder Bio</Label><Textarea id="founderSection.bio" {...register('founderSection.bio')} rows={4} className="mt-1" placeholder="A brief bio about the founder."/>
        {errors.founderSection?.bio && <p className="text-sm text-destructive mt-1">{errors.founderSection.bio.message}</p>}</div>
        <ImageFieldSection
            sectionName="founderSection"
            label="Founder"
            imagePreviewUrl={founderImagePreview}
            onFileChange={handleFounderImageFileChange}
            selectedFileName={selectedFounderImageFile?.name}
            aiHintName="founderSection.imageAiHint"
        />
      </SectionCard>

       <SectionCard title="Mission & Vision Section (Optional)" icon={Sparkles} showSectionToggleName="showMissionVisionSection">
        <div>
          <Label htmlFor="missionVisionSection.missionTitle">Mission Title</Label>
          <Input id="missionVisionSection.missionTitle" {...register('missionVisionSection.missionTitle')} className="mt-1" placeholder="e.g., Our Mission" />
        </div>
        <div>
          <Label htmlFor="missionVisionSection.missionText">Mission Text</Label>
          <Textarea id="missionVisionSection.missionText" {...register('missionVisionSection.missionText')} rows={3} className="mt-1" placeholder="Describe your company's mission."/>
        </div>
        <Separator className="my-6"/>
        <div>
          <Label htmlFor="missionVisionSection.visionTitle">Vision Title</Label>
          <Input id="missionVisionSection.visionTitle" {...register('missionVisionSection.visionTitle')} className="mt-1" placeholder="e.g., Our Vision"/>
        </div>
        <div>
          <Label htmlFor="missionVisionSection.visionText">Vision Text</Label>
          <Textarea id="missionVisionSection.visionText" {...register('missionVisionSection.visionText')} rows={3} className="mt-1" placeholder="Describe your company's vision."/>
        </div>
      </SectionCard>

      <SectionCard title="Services Overview" icon={Briefcase} description="Highlight key services offered." showSectionToggleName="showServicesIntroSection">
         <div>
            <Label htmlFor="servicesIntroSection.title">Section Title</Label>
            <Input id="servicesIntroSection.title" {...register('servicesIntroSection.title')} className="mt-1" placeholder="e.g., What We Do Best"/>
            {errors.servicesIntroSection?.title && <p className="text-sm text-destructive mt-1">{errors.servicesIntroSection.title.message}</p>}
        </div>
        <div>
            <Label htmlFor="servicesIntroSection.introText">Introductory Text</Label>
            <Textarea id="servicesIntroSection.introText" {...register('servicesIntroSection.introText')} rows={3} className="mt-1" placeholder="Briefly introduce your range of services."/>
            {errors.servicesIntroSection?.introText && <p className="text-sm text-destructive mt-1">{errors.servicesIntroSection.introText.message}</p>}
        </div>
        
        <Separator className="my-6" />
        <Label className="text-md font-medium mb-2 block">Service Highlights ({fields.length})</Label>
        <div className="space-y-4">
        {fields.map((item, index) => (
          <Card key={item.id} className="p-4 space-y-3 bg-muted/30 border-dashed">
            <div className="flex justify-between items-center">
                <p className="font-medium text-sm">Service Item #{index + 1}</p>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <input type="hidden" {...register(`servicesHighlights.${index}.id`)} />
            <div><Label htmlFor={`servicesHighlights.${index}.icon`}>Icon Name (from Lucide React)</Label><Input id={`servicesHighlights.${index}.icon`} {...register(`servicesHighlights.${index}.icon`)} placeholder="e.g., Code, Zap, Layers, Globe" className="mt-0.5"/>
            {errors.servicesHighlights?.[index]?.icon && <p className="text-sm text-destructive mt-1">{errors.servicesHighlights[index]?.icon?.message}</p>}</div>
            <div><Label htmlFor={`servicesHighlights.${index}.name`}>Service Name</Label><Input id={`servicesHighlights.${index}.name`} {...register(`servicesHighlights.${index}.name`)} placeholder="e.g., Web Development" className="mt-0.5"/>
            {errors.servicesHighlights?.[index]?.name && <p className="text-sm text-destructive mt-1">{errors.servicesHighlights[index]?.name?.message}</p>}</div>
            <div><Label htmlFor={`servicesHighlights.${index}.description`}>Short Description</Label><Textarea id={`servicesHighlights.${index}.description`} {...register(`servicesHighlights.${index}.description`)} rows={2} placeholder="Briefly describe this service highlight." className="mt-0.5"/>
            {errors.servicesHighlights?.[index]?.description && <p className="text-sm text-destructive mt-1">{errors.servicesHighlights[index]?.description?.message}</p>}</div>
          </Card>
        ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ id: `service-${Date.now()}${Math.random().toString(36).substring(2, 8)}`, icon: 'Sparkles', name: '', description: '' })}
          className="mt-4"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Service Highlight
        </Button>
         {errors.servicesHighlights && typeof errors.servicesHighlights.message === 'string' && <p className="text-sm text-destructive mt-1">{errors.servicesHighlights.message}</p>}
      </SectionCard>

      <SectionCard title="Company Overview Section" icon={Building} showSectionToggleName="showCompanyOverviewSection">
         <div>
          <Label htmlFor="companyOverviewSection.title">Section Title</Label>
          <Input id="companyOverviewSection.title" {...register('companyOverviewSection.title')} className="mt-1" placeholder="e.g., Why Choose Us?"/>
          {errors.companyOverviewSection?.title && <p className="text-sm text-destructive mt-1">{errors.companyOverviewSection.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="companyOverviewSection.text">Text Content</Label>
          <Textarea id="companyOverviewSection.text" {...register('companyOverviewSection.text')} rows={5} className="mt-1" placeholder="Provide more details about your company, values, or approach."/>
          {errors.companyOverviewSection?.text && <p className="text-sm text-destructive mt-1">{errors.companyOverviewSection.text.message}</p>}
        </div>
         <ImageFieldSection
            sectionName="companyOverviewSection"
            label="Company Overview"
            imagePreviewUrl={companyOverviewImagePreview}
            onFileChange={handleCompanyOverviewImageFileChange}
            selectedFileName={selectedCompanyOverviewImageFile?.name}
            aiHintName="companyOverviewSection.imageAiHint"
        />
      </SectionCard>

      <SectionCard title="Call To Action Section" icon={MessageCircle} showSectionToggleName="showCallToActionSection">
         <div>
          <Label htmlFor="callToActionSection.title">CTA Title</Label>
          <Input id="callToActionSection.title" {...register('callToActionSection.title')} className="mt-1" placeholder="e.g., Ready to Start Your Project?"/>
          {errors.callToActionSection?.title && <p className="text-sm text-destructive mt-1">{errors.callToActionSection.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="callToActionSection.text">CTA Text</Label>
          <Textarea id="callToActionSection.text" {...register('callToActionSection.text')} rows={2} className="mt-1" placeholder="Encourage users to get in touch."/>
          {errors.callToActionSection?.text && <p className="text-sm text-destructive mt-1">{errors.callToActionSection.text.message}</p>}
        </div>
        <div>
          <Label htmlFor="callToActionSection.buttonText">CTA Button Text</Label>
          <Input id="callToActionSection.buttonText" {...register('callToActionSection.buttonText')} className="mt-1" placeholder="e.g., Get a Free Quote"/>
          {errors.callToActionSection?.buttonText && <p className="text-sm text-destructive mt-1">{errors.callToActionSection.buttonText.message}</p>}
        </div>
        <div>
          <Label htmlFor="callToActionSection.buttonLink">CTA Button Link</Label>
          <Input id="callToActionSection.buttonLink" {...register('callToActionSection.buttonLink')} className="mt-1" placeholder="/contact"/>
          {errors.callToActionSection?.buttonLink && <p className="text-sm text-destructive mt-1">{errors.callToActionSection.buttonLink.message}</p>}
        </div>
      </SectionCard>

      <CardFooter className="pt-6 border-t border-border flex justify-end">
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save About Page Content
        </Button>
      </CardFooter>
    </form>
  );
}

