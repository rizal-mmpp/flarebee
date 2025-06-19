
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Settings, Info, Users, Briefcase, Sparkles, MessageCircle, Building, ListChecks, PlusCircle, Trash2 } from 'lucide-react'; // Added Building, ListChecks, MessageCircle, PlusCircle, Trash2
import { useToast } from '@/hooks/use-toast';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import { updateSitePageContentAction } from '@/lib/actions/sitePage.actions';
import type { PublicAboutPageContent, PublicAboutPageServiceItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
// import { CustomDropzone } from '@/components/ui/custom-dropzone'; // Keep for future image uploads


const serviceItemSchema = z.object({
  id: z.string().min(1, 'Service item ID is required'),
  icon: z.string().min(1, 'Icon name (Lucide) is required'),
  name: z.string().min(1, 'Service item name is required'),
  description: z.string().min(1, 'Service item description is required'),
});

const pageSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().min(1, 'Text is required'),
  imageUrl: z.string().url('Must be a valid URL or empty').or(z.literal('')).nullable().optional(),
  imageAiHint: z.string().max(50, "AI hint too long").optional(),
});

const publicAboutPageSchema = z.object({
  pageTitle: z.string().min(1, 'Page title is required.'),
  heroSection: z.object({
    tagline: z.string().min(1, 'Tagline is required.'),
    subTagline: z.string().optional(),
    imageUrl: z.string().url('Must be a valid URL or empty').or(z.literal('')).nullable().optional(),
    imageAiHint: z.string().max(50, "AI hint too long").optional(),
    ctaButtonText: z.string().optional(),
    ctaButtonLink: z.string().url('Must be a valid URL or empty').or(z.literal('')).optional(),
  }),
  historySection: pageSectionSchema,
  founderSection: z.object({
    name: z.string().min(1, 'Founder name is required.'),
    title: z.string().min(1, 'Founder title is required.'),
    bio: z.string().min(1, 'Founder bio is required.'),
    imageUrl: z.string().url('Must be a valid URL or empty').or(z.literal('')).nullable().optional(),
    imageAiHint: z.string().max(50, "AI hint too long").optional(),
  }),
  missionVisionSection: z.object({
    missionTitle: z.string().optional(),
    missionText: z.string().optional(),
    missionImageUrl: z.string().url('Must be a valid URL or empty').or(z.literal('')).nullable().optional(),
    missionImageAiHint: z.string().max(50, "AI hint too long").optional(),
    visionTitle: z.string().optional(),
    visionText: z.string().optional(),
    visionImageUrl: z.string().url('Must be a valid URL or empty').or(z.literal('')).nullable().optional(),
    visionImageAiHint: z.string().max(50, "AI hint too long").optional(),
  }).optional(),
  servicesIntroSection: z.object({
    title: z.string().min(1, 'Services intro title is required'),
    introText: z.string().min(1, 'Services intro text is required'),
  }).optional(),
  servicesHighlights: z.array(serviceItemSchema).optional(),
  companyOverviewSection: pageSectionSchema,
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

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<PublicAboutFormValues>({
    resolver: zodResolver(publicAboutPageSchema),
    // Default values will be set by fetching or from DEFAULT_PUBLIC_ABOUT_CONTENT via getSitePageContent
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "servicesHighlights",
  });

  useEffect(() => {
    setIsLoadingContent(true);
    getSitePageContent('public-about')
      .then((data) => {
        if (data && data.id === 'public-about') {
          const content = data as PublicAboutPageContent;
          reset({
            pageTitle: content.pageTitle,
            heroSection: content.heroSection,
            historySection: content.historySection,
            founderSection: content.founderSection,
            missionVisionSection: content.missionVisionSection || { missionTitle: '', missionText: '', visionTitle: '', visionText: '' },
            servicesIntroSection: content.servicesIntroSection || { title: '', introText: ''},
            servicesHighlights: content.servicesHighlights || [],
            companyOverviewSection: content.companyOverviewSection,
            callToActionSection: content.callToActionSection,
          });
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

  const onSubmit: SubmitHandler<PublicAboutFormValues> = (data) => {
    startSaveTransition(async () => {
      const pageDataForAction: PublicAboutPageContent = {
        id: 'public-about',
        ...data,
        // Ensure optional fields that might be undefined from form are handled correctly
        missionVisionSection: data.missionVisionSection && (data.missionVisionSection.missionText || data.missionVisionSection.visionText) ? data.missionVisionSection : undefined,
        servicesIntroSection: data.servicesIntroSection && data.servicesIntroSection.title ? data.servicesIntroSection : undefined,
        servicesHighlights: data.servicesHighlights && data.servicesHighlights.length > 0 ? data.servicesHighlights : undefined,
      };
      const formData = new FormData();
      formData.append('pageDataJson', JSON.stringify(pageDataForAction));
      
      const result = await updateSitePageContentAction('public-about', formData);
      if (result.success) {
        toast({ title: 'Page Saved', description: 'Public About Us page has been updated successfully.' });
        router.push('/admin/pages');
      } else {
        toast({ title: 'Error Saving Page', description: result.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    });
  };
  
  const SectionCard: React.FC<{title: string, description?: string, icon?: React.ElementType, children: React.ReactNode, cardClassName?: string}> = 
    ({title, description, icon: Icon, children, cardClassName}) => (
    <Card className={cardClassName}>
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                {Icon && <Icon className="mr-3 h-6 w-6 text-primary" />}
                {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
            {children}
        </CardContent>
    </Card>
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
        <div>
          <Label htmlFor="heroSection.imageUrl">Hero Image URL (Optional)</Label>
          <Input id="heroSection.imageUrl" {...register('heroSection.imageUrl')} className="mt-1" placeholder="https://placehold.co/1200x600.png" />
          {errors.heroSection?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.heroSection.imageUrl.message}</p>}
        </div>
         <div>
          <Label htmlFor="heroSection.imageAiHint">Hero Image AI Hint (Optional, 1-2 words)</Label>
          <Input id="heroSection.imageAiHint" {...register('heroSection.imageAiHint')} className="mt-1" placeholder="e.g., modern technology" />
        </div>
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
      
      <SectionCard title="History Section" icon={ListChecks}>
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
        <div>
          <Label htmlFor="historySection.imageUrl">Image URL (Optional)</Label>
          <Input id="historySection.imageUrl" {...register('historySection.imageUrl')} className="mt-1" placeholder="https://placehold.co/600x400.png" />
          {errors.historySection?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.historySection.imageUrl.message}</p>}
        </div>
         <div>
          <Label htmlFor="historySection.imageAiHint">History Image AI Hint (Optional)</Label>
          <Input id="historySection.imageAiHint" {...register('historySection.imageAiHint')} className="mt-1" placeholder="e.g., timeline graph" />
        </div>
      </SectionCard>

      <SectionCard title="Founder Section" icon={Users}>
        <div><Label htmlFor="founderSection.name">Founder Name</Label><Input id="founderSection.name" {...register('founderSection.name')} className="mt-1" placeholder="Rizal Iswandy"/>
        {errors.founderSection?.name && <p className="text-sm text-destructive mt-1">{errors.founderSection.name.message}</p>}</div>
        <div><Label htmlFor="founderSection.title">Founder Title</Label><Input id="founderSection.title" {...register('founderSection.title')} className="mt-1" placeholder="e.g., Founder & Lead Innovator"/>
        {errors.founderSection?.title && <p className="text-sm text-destructive mt-1">{errors.founderSection.title.message}</p>}</div>
        <div><Label htmlFor="founderSection.bio">Founder Bio</Label><Textarea id="founderSection.bio" {...register('founderSection.bio')} rows={4} className="mt-1" placeholder="A brief bio about the founder."/>
        {errors.founderSection?.bio && <p className="text-sm text-destructive mt-1">{errors.founderSection.bio.message}</p>}</div>
        <div><Label htmlFor="founderSection.imageUrl">Founder Image URL (Optional)</Label><Input id="founderSection.imageUrl" {...register('founderSection.imageUrl')} className="mt-1" placeholder="https://placehold.co/400x400.png" />
        {errors.founderSection?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.founderSection.imageUrl.message}</p>}</div>
        <div><Label htmlFor="founderSection.imageAiHint">Founder Image AI Hint</Label><Input id="founderSection.imageAiHint" {...register('founderSection.imageAiHint')} className="mt-1" placeholder="e.g., professional portrait" /></div>
      </SectionCard>

       <SectionCard title="Mission & Vision Section (Optional)" icon={Sparkles} description="Clearly state your company's mission and vision.">
        <div>
          <Label htmlFor="missionVisionSection.missionTitle">Mission Title</Label>
          <Input id="missionVisionSection.missionTitle" {...register('missionVisionSection.missionTitle')} className="mt-1" placeholder="e.g., Our Mission" />
        </div>
        <div>
          <Label htmlFor="missionVisionSection.missionText">Mission Text</Label>
          <Textarea id="missionVisionSection.missionText" {...register('missionVisionSection.missionText')} rows={3} className="mt-1" placeholder="Describe your company's mission."/>
        </div>
        <div>
          <Label htmlFor="missionVisionSection.missionImageUrl">Mission Image URL (Optional)</Label>
          <Input id="missionVisionSection.missionImageUrl" {...register('missionVisionSection.missionImageUrl')} className="mt-1" placeholder="https://placehold.co/600x400.png" />
        </div>
         <div>
          <Label htmlFor="missionVisionSection.missionImageAiHint">Mission Image AI Hint (Optional)</Label>
          <Input id="missionVisionSection.missionImageAiHint" {...register('missionVisionSection.missionImageAiHint')} className="mt-1" />
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
        <div>
          <Label htmlFor="missionVisionSection.visionImageUrl">Vision Image URL (Optional)</Label>
          <Input id="missionVisionSection.visionImageUrl" {...register('missionVisionSection.visionImageUrl')} className="mt-1" placeholder="https://placehold.co/600x400.png" />
        </div>
         <div>
          <Label htmlFor="missionVisionSection.visionImageAiHint">Vision Image AI Hint (Optional)</Label>
          <Input id="missionVisionSection.visionImageAiHint" {...register('missionVisionSection.visionImageAiHint')} className="mt-1" />
        </div>
      </SectionCard>

      <SectionCard title="Services Overview" icon={Briefcase} description="Highlight key services offered.">
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


      <SectionCard title="Company Overview Section" icon={Building}>
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
        <div>
          <Label htmlFor="companyOverviewSection.imageUrl">Image URL (Optional)</Label>
          <Input id="companyOverviewSection.imageUrl" {...register('companyOverviewSection.imageUrl')} className="mt-1" placeholder="https://placehold.co/600x400.png" />
           {errors.companyOverviewSection?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.companyOverviewSection.imageUrl.message}</p>}
        </div>
         <div>
          <Label htmlFor="companyOverviewSection.imageAiHint">Image AI Hint (Optional)</Label>
          <Input id="companyOverviewSection.imageAiHint" {...register('companyOverviewSection.imageAiHint')} className="mt-1" placeholder="e.g., team working together" />
        </div>
      </SectionCard>

      <SectionCard title="Call To Action Section" icon={MessageCircle}>
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
