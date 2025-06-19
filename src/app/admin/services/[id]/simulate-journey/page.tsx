
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
  ArrowLeft, Loader2, ServerCrash, Play, CheckSquare, Edit2, MessageSquare, UserCheck, Users, 
  ShieldQuestion, Sparkles, RotateCcw, Save, Briefcase, ChevronLeft, ChevronRight,
  Search, Presentation, Wand2, UserPlus, LayoutDashboard, ShoppingBag, CreditCard, ListChecks, Rocket, Repeat
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

  useEffect(() => {
    if (serviceId) {
      setIsLoading(true);
      setError(null);
      getServiceByIdFromFirestore(serviceId)
        .then((fetchedService) => {
          if (fetchedService) {
            setService(fetchedService);
            // Initialize notes only if not already populated (e.g. from a previous load or state change)
            setJourneyNotes(prevNotes => {
              const initialNotes: Record<string, string> = {};
              let notesChanged = false;
              journeyStages.forEach(stage => {
                initialNotes[stage.id] = prevNotes[stage.id] || '';
                if (!prevNotes[stage.id]) notesChanged = true; // Check if we are truly initializing
              });
              return notesChanged ? initialNotes : prevNotes;
            });
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

  const handleSaveJourney = () => {
    console.log("Saving Journey Notes for Service ID:", serviceId, journeyNotes);
    alert("Save functionality is not implemented yet. Notes logged to console.");
    // Future: await saveJourneyNotesToFirestore(serviceId, journeyNotes);
  };
  
  const handleResetJourney = () => {
    const initialNotes: Record<string, string> = {};
    journeyStages.forEach(stage => initialNotes[stage.id] = '');
    setJourneyNotes(initialNotes);
    alert("Journey notes reset on this page. No data was saved or deleted from a server.");
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
    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)]">
      <Card className="mb-6 rounded-xl border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
                <Play className="mr-3 h-7 w-7 text-primary flex-shrink-0" />
                Customer Journey Simulation
              </h1>
              <p className="text-muted-foreground text-sm ml-10">
                For service: <span className="font-semibold text-foreground">{service.title}</span>
              </p>
            </div>
            <TooltipProvider delayDuration={0}>
              <div className="flex items-center justify-start md:justify-end gap-1.5 mt-2 md:mt-0 flex-shrink-0">
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleResetJourney}><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Reset All Notes</p></TooltipContent></Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2 border-b border-border pb-4">
            {journeyStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setCurrentStageIndex(index)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  currentStageIndex === index
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className={cn("flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold",
                  currentStageIndex === index ? "bg-primary-foreground text-primary" : "bg-border text-foreground/70"
                )}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <span className="hidden sm:inline-block">{stage.title.substring(stage.title.indexOf('.') + 1).trim()}</span>
                <span className="sm:hidden">{String(index + 1).padStart(2, '0')}</span> 
                {currentStageIndex === index && <stage.icon className="h-4 w-4 ml-auto hidden sm:inline-block" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <currentStage.icon className="mr-3 h-6 w-6 text-primary" />
              {currentStage.title}
            </CardTitle>
            <div className="text-sm text-muted-foreground space-y-2 pt-2">
              {currentStage.details.map((detail, idx) => (
                <p key={idx} className="leading-relaxed">{detail.startsWith('Touchpoints:') || detail.startsWith('Key Actions:') || detail.startsWith('Content:') || detail.startsWith('CTAs:') || detail.startsWith('Show project steps:') || detail.startsWith('Post-checkout dashboard shows:') || detail.startsWith('Confirmation Page:') || detail.startsWith('Client dashboard includes:') || detail.startsWith('Inline,') ? <strong>{detail.substring(0, detail.indexOf(':')+1)}</strong> : ''}{detail.startsWith('Touchpoints:') || detail.startsWith('Key Actions:') || detail.startsWith('Content:') || detail.startsWith('CTAs:') || detail.startsWith('Show project steps:') || detail.startsWith('Post-checkout dashboard shows:') || detail.startsWith('Confirmation Page:') || detail.startsWith('Client dashboard includes:') || detail.startsWith('Inline,') ? detail.substring(detail.indexOf(':')+1) : detail}</p>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col pt-4">
            <Label htmlFor={`notes-${currentStage.id}`} className="text-base font-medium text-foreground mb-2">
              Visual Design & User Experience Notes for this Stage:
            </Label>
            <Textarea
              id={`notes-${currentStage.id}`}
              value={journeyNotes[currentStage.id] || ''}
              onChange={(e) => handleNoteChange(currentStage.id, e.target.value)}
              placeholder={currentStage.placeholder}
              rows={10} 
              className="bg-background flex-grow resize-none text-base"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Service Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {service.imageUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={service.imageUrl}
                  alt={service.title}
                  fill
                  className="object-cover"
                  data-ai-hint={service.dataAiHint || "service image"}
                />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-4">{service.shortDescription}</p>
            </div>
            <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/admin/services/${serviceId}`}>
                    <Briefcase className="mr-2 h-4 w-4" /> View Full Service Details
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-xl border-0 shadow-none">
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
          <Button variant="outline" asChild className="w-full sm:w-auto group">
            <Link href={`/admin/services/${serviceId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Service Details
            </Link>
          </Button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={goToPreviousStage}
              disabled={currentStageIndex === 0}
              className="w-1/2 sm:w-auto"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={goToNextStage}
              disabled={currentStageIndex === journeyStages.length - 1}
              className="w-1/2 sm:w-auto"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleSaveJourney} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" /> Save Journey (Dev Log)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
