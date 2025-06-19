
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Service, JourneyStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Loader2, ServerCrash, Play, Save, Briefcase, ChevronLeft, ChevronRight,
  UploadCloud, Image as ImageIcon 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import NextImage from 'next/image'; 
import { CustomDropzone } from '@/components/ui/custom-dropzone';

// Default journey stages if not found in service data
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

  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>(DEFAULT_JOURNEY_STAGES);


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
              initialNotes[stage.id] = ''; // Or load saved notes if they exist on the service
              initialImages[stage.id] = null;
            });
            setJourneyNotes(initialNotes);
            setStageImages(initialImages);
            setSelectedFiles({});
          } else {
            setError('Service not found.');
            setJourneyStages(DEFAULT_JOURNEY_STAGES); // Use default if service not found
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service details:', err);
          setError('Failed to load service details. Please try again.');
          setJourneyStages(DEFAULT_JOURNEY_STAGES); // Use default on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [serviceId]);

  const handleNoteChange = (stageId: string, value: string) => {
    setJourneyNotes(prev => ({ ...prev, [stageId]: value }));
  };
  
  const handleImageFileChange = (stageId: string, file: File | null) => {
    if (stageImages[stageId]) {
      URL.revokeObjectURL(stageImages[stageId]!);
    }
    setSelectedFiles(prev => ({...prev, [stageId]: file }));
    if (file) {
      setStageImages(prev => ({ ...prev, [stageId]: URL.createObjectURL(file) }));
    } else {
      setStageImages(prev => ({ ...prev, [stageId]: null }));
    }
  };

  const handleSaveJourney = () => {
    console.log("Saving Journey Notes for Service ID:", serviceId, journeyNotes);
    console.log("Stage Images (selected files):", selectedFiles); 
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
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
        <Briefcase className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service or Journey Stage Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested service or journey stage could not be loaded.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)] space-y-6 bg-muted/20 p-4 md:p-6">
      {/* Top Header Section */}
      <Card className="rounded-xl shadow-md">
        <CardHeader className="pb-3 pt-5 px-5 md:px-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Customer Journey Simulation
          </h1>
          <p className="text-sm text-muted-foreground">
            For service: <span className="font-semibold text-foreground">{service.title}</span>
          </p>
        </CardHeader>
        
        {/* Stepper Bar */}
        <CardContent className="px-5 md:px-6 py-4 border-y">
          <div className="flex items-center overflow-x-auto pb-2 -mb-2">
            {journeyStages.map((stage, index) => (
              <React.Fragment key={stage.id}>
                <div 
                  className="flex flex-col items-center cursor-pointer group" 
                  onClick={() => setCurrentStageIndex(index)}
                >
                  <div className={cn(
                      "relative flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold border-2 transition-all duration-200 ease-in-out",
                      currentStageIndex === index ? "bg-primary border-primary text-primary-foreground scale-110" : 
                      index < currentStageIndex ? "bg-primary/20 border-primary text-primary" : 
                      "bg-card border-border text-muted-foreground group-hover:border-primary group-hover:text-primary"
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <span className={cn(
                    "mt-1.5 text-[0.65rem] sm:text-xs text-center w-20 truncate font-medium",
                    currentStageIndex === index ? "text-primary" : 
                    index < currentStageIndex ? "text-primary/80" :
                    "text-muted-foreground group-hover:text-primary"
                  )}>
                    {stage.title}
                  </span>
                </div>
                {index < journeyStages.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 min-w-[20px] sm:min-w-[30px] md:min-w-[40px]", // Responsive connector length
                    index < currentStageIndex ? "bg-primary" : "bg-border"
                  )} style={{ marginTop: '-0.875rem' }}></div> 
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>

        {/* Control Bar */}
        <CardContent className="p-3 md:p-4 flex items-center justify-between">
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
          </TooltipProvider>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={goToPreviousStage}
              disabled={currentStageIndex === 0}
              className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={goToNextStage}
              disabled={currentStageIndex === journeyStages.length - 1}
              className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
            >
              Next <ChevronRight className="ml-1 h-3.5 w-3.5 sm:ml-1.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
          
          <TooltipProvider delayDuration={0}>
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
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 flex-grow">
        {/* Left Column: Stage Label & UI Preview */}
        <Card className="lg:col-span-3 rounded-xl shadow-md flex flex-col">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-lg md:text-xl flex items-center text-foreground">
              Stage {String(currentStageIndex + 1).padStart(2, '0')}: {currentStage.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col pt-2 space-y-3 px-5 pb-5">
            <Label htmlFor={`image-upload-${currentStage.id}`} className="text-sm font-medium text-muted-foreground">
              Visual Mockup / UI Preview for this Stage:
            </Label>
            <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-border/70 rounded-lg p-3 bg-background min-h-[250px] sm:min-h-[300px]">
              {currentStageImagePreview ? (
                <div className="relative w-full max-w-full aspect-video">
                  <NextImage
                    src={currentStageImagePreview}
                    alt={`Preview for ${currentStage.title}`}
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground space-y-1.5">
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/70" />
                  <p className="text-xs">No preview image uploaded for this stage.</p>
                </div>
              )}
            </div>
             <CustomDropzone
                id={`image-upload-${currentStage.id}`}
                onFileChange={(file) => handleImageFileChange(currentStage.id, file)}
                currentFileName={currentSelectedFile?.name}
                accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }}
                maxSize={1 * 1024 * 1024} 
              />
          </CardContent>
        </Card>

        {/* Right Column: Stage Description & Notes */}
        <Card className="lg:col-span-2 rounded-xl shadow-md flex flex-col">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-lg md:text-xl text-foreground">Stage Elements & UX Notes</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col pt-2 space-y-3 px-5 pb-5">
            <div className="text-xs text-muted-foreground space-y-1.5 border rounded-md p-3 bg-background max-h-48 overflow-y-auto">
              <h4 className="font-semibold text-foreground/90 mb-1 text-sm">Key Elements for this Stage:</h4>
              {currentStage.details.map((detail, idx) => (
                <p key={idx} className="leading-relaxed">
                  {detail.startsWith('Touchpoints:') || detail.startsWith('Key Actions:') || detail.startsWith('Content:') || detail.startsWith('CTAs:') || detail.startsWith('Show project steps:') || detail.startsWith('Post-checkout dashboard shows:') || detail.startsWith('Confirmation Page:') || detail.startsWith('Client dashboard includes:') || detail.startsWith('Inline,') ? <strong>{detail.substring(0, detail.indexOf(':')+1)}</strong> : ''}{detail.startsWith('Touchpoints:') || detail.startsWith('Key Actions:') || detail.startsWith('Content:') || detail.startsWith('CTAs:') || detail.startsWith('Show project steps:') || detail.startsWith('Post-checkout dashboard shows:') || detail.startsWith('Confirmation Page:') || detail.startsWith('Client dashboard includes:') || detail.startsWith('Inline,') ? detail.substring(detail.indexOf(':')+1) : detail}
                </p>
              ))}
            </div>
            <div className="flex-grow flex flex-col">
                <Label htmlFor={`notes-${currentStage.id}`} className="text-sm font-medium text-muted-foreground mb-1.5">
                Your Design, Visual & UX Notes for this Stage:
                </Label>
                <Textarea
                id={`notes-${currentStage.id}`}
                value={journeyNotes[currentStage.id] || ''}
                onChange={(e) => handleNoteChange(currentStage.id, e.target.value)}
                placeholder={currentStage.placeholder}
                rows={8} 
                className="bg-background flex-grow resize-none text-sm"
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

