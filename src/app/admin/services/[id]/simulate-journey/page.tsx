
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Loader2, ServerCrash, Play, Save, Briefcase, ChevronLeft, ChevronRight,
  Search, Presentation, Wand2, UserPlus, LayoutDashboard, ShoppingBag, CreditCard, ListChecks, Rocket, Repeat, UploadCloud, Image as ImageIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import NextImage from 'next/image'; // Renamed import to avoid conflict
import { CustomDropzone } from '@/components/ui/custom-dropzone';

const journeyStages = [
  { 
    id: 'discovery', 
    title: '1. Discovery', 
    icon: Search,
    details: [
      "Touchpoints: Homepage → “Explore Our Services”, Services List → “Business Profile Website”, Paid Ads, Social Media, WhatsApp Campaigns",
      "Key Actions: Click service card → open dedicated service landing page"
    ],
    placeholder: "Describe visual elements and user interactions for Discovery. What does the user see on the homepage? How is the service presented in lists/ads? What's the initial hook?"
  },
  { 
    id: 'service-landing-page', 
    title: '2. Service Landing Page', 
    icon: Presentation,
    details: [
      "Content: Hero: “Professional Website for Your Business – Launch in Days”, Value props (e.g., Free subdomain, SEO ready, CMS), Demo links / client success stories",
      "CTAs: “Start Now” (Primary), “Preview Demo”, “Chat First”"
    ],
    placeholder: "Detail the layout of the service landing page. Visual hierarchy? CTA displays? Demo preview look? How are value props communicated visually?"
  },
  { 
    id: 'smart-onboarding', 
    title: '3. Smart Onboarding (Pre-Login)', 
    icon: Wand2,
    details: [
      "Inline, 3-step lightweight wizard: Business Name & Type, Domain options ('I have one', 'Search domain', 'Skip for now' → subdomain), Select preferred style/template (quick preview).",
      "All fields optional. 'Continue' active if at least 1 field filled."
    ],
    placeholder: "Design the wizard steps. How are domain options presented? How does the style/template quick preview work visually? What's the feel of this onboarding?"
  },
  { 
    id: 'sign-in-up', 
    title: '4. Sign In / Sign Up', 
    icon: UserPlus,
    details: [
      "Google OAuth & Email options.",
      "Progress from onboarding is saved in session/local storage and applied post-login."
    ],
    placeholder: "Describe the sign-in/sign-up interface. How is the saved onboarding progress communicated or handled visually upon return?"
  },
  { 
    id: 'dashboard-start-project', 
    title: '5. Dashboard: Start Project', 
    icon: LayoutDashboard,
    details: [
      "Now in authenticated project dashboard.",
      "Auto-generated project draft based on onboarding.",
      "Show project steps: ✅ Business Info, ✅ Domain, 🟨 Template Selection (edit or keep), 🟧 Package Plan, 🟩 Custom Feature (optional)."
    ],
    placeholder: "Visualize the initial project dashboard. How is the draft project presented? How are the project steps shown? How can users edit pre-filled info?"
  },
  { 
    id: 'select-package-addons', 
    title: '6. Select Package & Add-ons', 
    icon: ShoppingBag,
    details: [
      "Show pricing tiers with visual comparison.",
      "Add-ons (CMS, Blog, WhatsApp button, Form, SEO setup, etc.).",
      "Upsell option for full custom dev."
    ],
    placeholder: "Design the package selection interface. How are tiers and add-ons visually distinct? How is the upsell presented without being intrusive?"
  },
  { 
    id: 'checkout', 
    title: '7. Checkout', 
    icon: CreditCard,
    details: [
      "Transparent breakdown: Subscription (monthly/annual), Add-on costs (if any).",
      "Payment options: card, VA, QRIS (Xendit).",
      "Post-payment CTA: “Go to Dashboard”."
    ],
    placeholder: "Visualize the checkout page. How is the cost breakdown presented clearly? How are payment options displayed? What's the success confirmation look like?"
  },
  { 
    id: 'project-status-tracker', 
    title: '8. Project Status Tracker (Dashboard)', 
    icon: ListChecks,
    details: [
      "Post-checkout dashboard shows: Project timeline (Planning → Development → Review → Launch), Chat with Dev team, Upload brand assets, Edit business info, Domain integration status, 'Invite teammate' (if relevant)."
    ],
    placeholder: "Design the project tracker. How is the timeline visualized? What does the chat interface look like? How are asset uploads and info editing handled?"
  },
  { 
    id: 'launch-delivery', 
    title: '9. Launch & Delivery', 
    icon: Rocket,
    details: [
      "Final site preview, DNS guide or auto-config, “Go Live” button.",
      "Confirmation Page: Success message, Analytics starter, CMS guide, Shareable link button."
    ],
    placeholder: "Visualize the final launch steps. What does the 'Go Live' confirmation look like? How are guides and success messages presented?"
  },
  { 
    id: 'post-launch-retention', 
    title: '10. Post-Launch & Retention', 
    icon: Repeat,
    details: [
      "Regular performance emails: “Your site had 134 views this week”.",
      "Client dashboard includes: CMS editor, Traffic stats (Google Analytics embed), Support ticket/chat, Plan management & renewals, Easy upgrade CTA: “Need More Pages?”."
    ],
    placeholder: "Design the post-launch dashboard elements. How are stats presented? What does the CMS editor access look like? How are upgrade CTAs integrated smoothly?"
  },
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
  const [stageImages, setStageImages] = useState<Record<string, string | null>>({}); // Stores object URLs for previews
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({}); // Stores actual File objects

  useEffect(() => {
    if (serviceId) {
      setIsLoading(true);
      setError(null);
      getServiceByIdFromFirestore(serviceId)
        .then((fetchedService) => {
          if (fetchedService) {
            setService(fetchedService);
            const initialNotes: Record<string, string> = {};
            const initialImages: Record<string, string | null> = {};
            journeyStages.forEach(stage => {
              initialNotes[stage.id] = '';
              initialImages[stage.id] = null;
            });
            setJourneyNotes(initialNotes);
            setStageImages(initialImages);
            setSelectedFiles({});
          } else {
            setError('Service not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service details:', err);
          setError('Failed to load service details. Please try again.');
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
    // Revoke previous object URL if it exists for this stage
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
  const currentStageImagePreview = stageImages[currentStage.id];
  const currentSelectedFile = selectedFiles[currentStage.id];


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

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Briefcase className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested service could not be found.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)] p-4 md:p-6 space-y-4 bg-muted/30">
      {/* Top Header Section */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Play className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Customer Journey Simulation
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            For service: <span className="font-semibold text-foreground">{service.title}</span>
          </p>
        </CardHeader>
      </Card>

      {/* Stepper Bar */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {journeyStages.map((stage, index) => (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setCurrentStageIndex(index)}
                    className={cn(
                      "flex flex-col items-center justify-center h-10 w-10 rounded-full text-xs font-semibold border-2 transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      currentStageIndex === index
                        ? "bg-primary border-primary text-primary-foreground scale-110"
                        : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
                    )}
                    aria-current={currentStageIndex === index ? "step" : undefined}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </button>
                  <span className={cn(
                    "mt-1.5 text-xs text-center w-20 truncate",
                    currentStageIndex === index ? "text-primary font-semibold" : "text-muted-foreground"
                  )}>
                    {stage.title.substring(stage.title.indexOf('.') + 1).trim()}
                  </span>
                </div>
                {index < journeyStages.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mt-5", // Align with center of circle
                    currentStageIndex > index ? "bg-primary" : "bg-border"
                  )}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Control Bar */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-3 flex items-center justify-between">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => router.push(`/admin/services/${serviceId}`)}>
                  <ArrowLeft className="h-5 w-5" />
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
              className="h-9 px-3"
            >
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={goToNextStage}
              disabled={currentStageIndex === journeyStages.length - 1}
              className="h-9 px-3"
            >
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
          
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="icon" onClick={handleSaveJourney} className="bg-primary hover:bg-primary/90">
                  <Save className="h-5 w-5" />
                  <span className="sr-only">Save Journey (Log)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Save Journey (Log to Console)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-grow">
        {/* Left Column: Stage Label & UI Preview */}
        <Card className="lg:col-span-3 rounded-xl shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <currentStage.icon className="mr-2 h-6 w-6 text-primary" />
              {currentStage.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col pt-2 space-y-4">
            <Label htmlFor={`image-upload-${currentStage.id}`} className="text-base font-medium text-foreground">
              Dynamic UI Preview/Mockup for this Stage:
            </Label>
            <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 bg-background min-h-[300px]">
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
                <div className="text-center text-muted-foreground space-y-2">
                  <ImageIcon className="h-12 w-12 mx-auto" />
                  <p className="text-sm">No preview image uploaded for this stage.</p>
                </div>
              )}
            </div>
             <CustomDropzone
                id={`image-upload-${currentStage.id}`}
                onFileChange={(file) => handleImageFileChange(currentStage.id, file)}
                currentFileName={currentSelectedFile?.name}
                accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }}
                maxSize={2 * 1024 * 1024} // 2MB limit for stage previews
              />
          </CardContent>
        </Card>

        {/* Right Column: Stage Description & Notes */}
        <Card className="lg:col-span-2 rounded-xl shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Stage Details & Notes</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col pt-2 space-y-4">
            <div className="text-sm text-muted-foreground space-y-2 border-b pb-3 mb-3">
              <h4 className="font-semibold text-foreground mb-1">Key Elements for this Stage:</h4>
              {currentStage.details.map((detail, idx) => (
                <p key={idx} className="leading-relaxed text-xs">
                  {detail.startsWith('Touchpoints:') || detail.startsWith('Key Actions:') || detail.startsWith('Content:') || detail.startsWith('CTAs:') || detail.startsWith('Show project steps:') || detail.startsWith('Post-checkout dashboard shows:') || detail.startsWith('Confirmation Page:') || detail.startsWith('Client dashboard includes:') || detail.startsWith('Inline,') ? <strong>{detail.substring(0, detail.indexOf(':')+1)}</strong> : ''}{detail.startsWith('Touchpoints:') || detail.startsWith('Key Actions:') || detail.startsWith('Content:') || detail.startsWith('CTAs:') || detail.startsWith('Show project steps:') || detail.startsWith('Post-checkout dashboard shows:') || detail.startsWith('Confirmation Page:') || detail.startsWith('Client dashboard includes:') || detail.startsWith('Inline,') ? detail.substring(detail.indexOf(':')+1) : detail}
                </p>
              ))}
            </div>
            <div className="flex-grow flex flex-col">
                <Label htmlFor={`notes-${currentStage.id}`} className="text-base font-medium text-foreground mb-1.5">
                Your Design & UX Notes:
                </Label>
                <Textarea
                id={`notes-${currentStage.id}`}
                value={journeyNotes[currentStage.id] || ''}
                onChange={(e) => handleNoteChange(currentStage.id, e.target.value)}
                placeholder={currentStage.placeholder}
                rows={10} 
                className="bg-background flex-grow resize-none text-sm"
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

