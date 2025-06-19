
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';

import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Service, JourneyStage } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowLeft, Loader2, ServerCrash, Save, Play, ChevronLeft, ChevronRight, 
  UploadCloud, Image as ImageIcon, FileText as StageDetailIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_JOURNEY_STAGES: JourneyStage[] = [
  { id: 'discovery', title: 'Discovery', details: ["Touchpoints: Homepage → “Explore Our Services”, Services List → “Business Profile Website”, Paid Ads, Social Media, WhatsApp Campaigns", "Key Actions: Click service card → open dedicated service landing page"], placeholder: "Describe visual elements and user interactions for Discovery. What does the user see on the homepage? How is the service presented in lists/ads? What's the initial hook?" },
  { id: 'service-landing-page', title: 'Service Landing Page', details: ["Content: Hero: “Professional Website for Your Business – Launch in Days”, Value props (e.g., Free subdomain, SEO ready, CMS), Demo links / client success stories", "CTAs: “Start Now” (Primary), “Preview Demo”, “Chat First”"], placeholder: "Detail the layout of the service landing page. Visual hierarchy? CTA displays? Demo preview look? How are value props communicated visually?" },
  { id: 'smart-onboarding', title: 'Smart Onboarding', details: ["Inline, 3-step lightweight wizard: Business Name & Type, Domain options ('I have one', 'Search domain', 'Skip for now' → subdomain), Select preferred style/template (quick preview).", "All fields optional. 'Continue' active if at least 1 field filled."], placeholder: "Design the wizard steps. How are domain options presented? How does the style/template quick preview work visually? What's the feel of this onboarding?" },
  { id: 'sign-in-up', title: 'Sign In / Sign Up', details: ["Google OAuth & Email options.", "Progress from onboarding is saved in session/local storage and applied post-login."], placeholder: "Describe the sign-in/sign-up interface. How is the saved onboarding progress communicated or handled visually upon return?" },
  { id: 'dashboard-start-project', title: 'Dashboard: Start Project', details: ["Now in authenticated project dashboard.", "Auto-generated project draft based on onboarding.", "Show project steps: ✅ Business Info, ✅ Domain, 🟨 Template Selection (edit or keep), 🟧 Package Plan, 🟩 Custom Feature (optional)."], placeholder: "Visualize the initial project dashboard. How is the draft project presented? How are the project steps shown? How can users edit pre-filled info?" },
  { id: 'select-package-addons', title: 'Select Package & Add-ons', details: ["Show pricing tiers with visual comparison.", "Add-ons (CMS, Blog, WhatsApp button, Form, SEO setup, etc.).", "Upsell option for full custom dev."], placeholder: "Design the package selection interface. How are tiers and add-ons visually distinct? How is the upsell presented without being intrusive?" },
  { id: 'checkout', title: 'Checkout', details: ["Transparent breakdown: Subscription (monthly/annual), Add-on costs (if any).", "Payment options: card, VA, QRIS (Xendit).", "Post-payment CTA: “Go to Dashboard”."], placeholder: "Visualize the checkout page. How is the cost breakdown presented clearly? How are payment options displayed? What's the success confirmation look like?" },
  { id: 'project-status-tracker', title: 'Project Status Tracker', details: ["Post-checkout dashboard shows: Project timeline (Planning → Development → Review → Launch), Chat with Dev team, Upload brand assets, Edit business info, Domain integration status, 'Invite teammate' (if relevant)."], placeholder: "Design the project tracker. How is the timeline visualized? What does the chat interface look like? How are asset uploads and info editing handled?" },
  { id: 'launch-delivery', title: 'Launch & Delivery', details: ["Final site preview, DNS guide or auto-config, “Go Live” button.", "Confirmation Page: Success message, Analytics starter, CMS guide, Shareable link button."], placeholder: "Visualize the final launch steps. What does the 'Go Live' confirmation look like? How are guides and success messages presented?" },
  { id: 'post-launch-retention', title: 'Post-Launch & Retention', details: ["Regular performance emails: “Your site had 134 views this week”.", "Client dashboard includes: CMS editor, Traffic stats (Google Analytics embed), Support ticket/chat, Plan management & renewals, Easy upgrade CTA: “Need More Pages?”."], placeholder: "Design the post-launch dashboard elements. How are stats presented? What does the CMS editor access look like? How are upgrade CTAs integrated smoothly?" },
];


export default function SimulateJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [journeyNotes, setJourneyNotes] = useState<Record<string, string>>({});
  const [stageImages, setStageImages] = useState<Record<string, string | null>>({}); 
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({}); 

  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>([]);

  useEffect(() => {
    if (serviceId) {
      setIsLoading(true);
      setError(null);
      getServiceByIdFromFirestore(serviceId)
        .then((fetchedService) => {
          if (fetchedService) {
            setService(fetchedService);
            const stages = fetchedService.customerJourneyStages && fetchedService.customerJourneyStages.length > 0 
              ? fetchedService.customerJourneyStages 
              : DEFAULT_JOURNEY_STAGES;
            setJourneyStages(stages);

            const initialNotes: Record<string, string> = {};
            const initialImages: Record<string, string | null> = {};
            stages.forEach(stage => {
              initialNotes[stage.id] = ''; 
              initialImages[stage.id] = null;
            });
            setJourneyNotes(initialNotes);
            setStageImages(initialImages);
            setSelectedFiles({});
          } else {
            setError('Service not found.');
            setJourneyStages(DEFAULT_JOURNEY_STAGES); 
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service details:', err);
          setError('Failed to load service details. Please try again.');
          setJourneyStages(DEFAULT_JOURNEY_STAGES); 
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [serviceId]);

  const handleNoteChange = (stageId: string, value: string) => {
    setJourneyNotes(prev => ({ ...prev, [stageId]: value }));
  };
  
  const handleImageFileChange = useCallback((stageId: string, file: File | null) => {
    if (stageImages[stageId]) {
      URL.revokeObjectURL(stageImages[stageId]!);
    }
    setSelectedFiles(prev => ({...prev, [stageId]: file }));
    if (file) {
      setStageImages(prev => ({ ...prev, [stageId]: URL.createObjectURL(file) }));
    } else {
      setStageImages(prev => ({ ...prev, [stageId]: null }));
    }
  }, [stageImages]);

  const handleSaveJourney = () => {
    console.log("Saving Journey Notes for Service ID:", serviceId, journeyNotes);
    console.log("Stage Images (selected files - to be uploaded):", selectedFiles); 
    alert("Save functionality is not implemented yet. Notes and file selections logged to console.");
  };
  
  const goToNextStage = () => {
    if (currentStageIndex < journeyStages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    }
  };

  const goToPreviousStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1);
    }
  };

  const currentStage = journeyStages[currentStageIndex];
  const currentStageImagePreview = currentStage ? stageImages[currentStage.id] : null;
  const currentSelectedFile = currentStage ? selectedFiles[currentStage.id] : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading service details...</p>
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
          <Link href={`/admin/services/${serviceId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Service Details
          </Link>
        </Button>
      </div>
    );
  }

  if (!service || !currentStage) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service or Journey Stage Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested service or journey stage could not be loaded.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-theme(spacing.16))]"> {/* Reduced overall top/bottom padding */}
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex items-center gap-3">
            <Play className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground leading-tight">
                    Customer Journey Simulation
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground leading-tight truncate max-w-xs md:max-w-sm">
                    For service: <span className="font-medium text-foreground/90">{service.title}</span>
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => router.push(`/admin/services/${serviceId}`)}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to Service Details</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Back to Service Details</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="icon" onClick={handleSaveJourney} className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4" />
                  <span className="sr-only">Save Journey (Log)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Save Journey (Log to Console)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-0"> {/* Changed grid for sidebar */}
        {/* Left Column: Stage Content */}
        <main className="lg:col-span-2 xl:col-span-3 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-xl md:text-2xl font-semibold text-foreground flex items-center">
                 <StageDetailIcon className="mr-3 h-6 w-6 text-primary/80" />
                 Stage {String(currentStageIndex + 1).padStart(2, '0')}: {currentStage.title}
              </CardTitle>
               <div className="flex justify-between items-center mt-3 mb-1"> {/* Pagination moved here */}
                <Button
                  variant="outline"
                  onClick={goToPreviousStage}
                  disabled={currentStageIndex === 0}
                  className="h-9 px-4 text-sm group"
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={goToNextStage}
                  disabled={currentStageIndex === journeyStages.length - 1}
                  className="h-9 px-4 text-sm group"
                >
                  Next <ChevronRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-5 px-5 pb-5">
              <div>
                <h4 className="text-base font-semibold text-muted-foreground mb-2">Key Elements & Considerations:</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-outside pl-5">
                  {currentStage.details.map((detail, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-2">
                <Label htmlFor={`notes-${currentStage.id}`} className="text-base font-semibold text-muted-foreground mb-2 block">
                  Visual Design & UX Notes:
                </Label>
                <Textarea
                  id={`notes-${currentStage.id}`}
                  value={journeyNotes[currentStage.id] || ''}
                  onChange={(e) => handleNoteChange(currentStage.id, e.target.value)}
                  placeholder={currentStage.placeholder || 'Describe the visual design, user interactions, and overall experience for this stage...'}
                  rows={8} 
                  className="text-sm bg-muted/20 border-border/70 focus:border-primary"
                />
              </div>

              <div className="pt-2">
                 <Label htmlFor={`image-upload-${currentStage.id}`} className="text-base font-semibold text-muted-foreground mb-2 block">
                    Visual Mockup / UI Preview for this Stage:
                </Label>
                <div className="mt-1 p-3 border-2 border-dashed border-border/50 rounded-lg bg-muted/20 min-h-[200px] flex flex-col items-center justify-center text-center">
                    {currentStageImagePreview ? (
                    <div className="relative w-full max-w-lg aspect-video mb-3">
                        <NextImage
                        src={currentStageImagePreview}
                        alt={`Preview for ${currentStage.title}`}
                        fill
                        className="object-contain rounded-md"
                        />
                    </div>
                    ) : (
                    <div className="text-muted-foreground space-y-1.5 py-6">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p className="text-sm">No preview image uploaded for this stage.</p>
                        <p className="text-xs">Upload a mockup or UI screenshot.</p>
                    </div>
                    )}
                     <CustomDropzone
                        id={`image-upload-${currentStage.id}`}
                        onFileChange={(file) => handleImageFileChange(currentStage.id, file)}
                        currentFileName={currentSelectedFile?.name}
                        accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }}
                        maxSize={1 * 1024 * 1024} 
                        className="w-full max-w-md"
                    />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Right Column: Vertical Stepper */}
        <aside className="lg:col-span-1 xl:col-span-1 p-4 md:p-6 bg-card border-l border-border overflow-y-auto"> {/* Changed to bg-card */}
          <div className="sticky top-0 py-2 bg-card z-10 mb-1 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground">Journey Stages ({journeyStages.length})</h3>
          </div>
          <div className="relative space-y-0 mt-2">
            {journeyStages.map((stage, index) => (
              <div 
                key={stage.id} 
                className="flex items-start group cursor-pointer py-1" // Reduced py-1.5 to py-1
                onClick={() => setCurrentStageIndex(index)}
              >
                <div className="flex flex-col items-center mr-3 flex-shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold border-2 transition-all duration-200 ease-in-out",
                      currentStageIndex === index ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md" : 
                      index < currentStageIndex ? "bg-primary/20 border-primary text-primary" : 
                      "bg-card border-border text-muted-foreground group-hover:border-primary/70 group-hover:text-primary"
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  {index < journeyStages.length - 1 && (
                    <div className={cn(
                      "w-px h-4 mt-1 transition-colors duration-200", // Reduced h-6 to h-4, mt-1.5 to mt-1
                      index < currentStageIndex ? "bg-primary" : "bg-border group-hover:bg-primary/30"
                    )}></div>
                  )}
                </div>
                <div 
                  className={cn(
                    "pt-0.5 transition-colors duration-200",
                    currentStageIndex === index ? "text-primary font-semibold" : 
                    index < currentStageIndex ? "text-primary/80 font-medium" :
                    "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <p className="text-sm leading-tight">{stage.title}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
