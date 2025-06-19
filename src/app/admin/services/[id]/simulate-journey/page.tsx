
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
import { ArrowLeft, Loader2, ServerCrash, Play, CheckSquare, Edit2, MessageSquare, UserCheck, Users, ShieldQuestion, Sparkles, RotateCcw, Save, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const journeyStages = [
  { id: 'discovery', title: 'Discovery & Awareness', icon: Sparkles, placeholder: 'How do potential customers become aware of this service? What problems are they trying to solve? Keywords they might use?' },
  { id: 'evaluation', title: 'Evaluation & Consideration', icon: ShieldQuestion, placeholder: 'What are their criteria for choosing a solution? What questions do they ask? What are their concerns or objections?' },
  { id: 'purchase', title: 'Purchase & Decision', icon: CheckSquare, placeholder: 'What triggers the decision to buy? What is the purchase process like? What information is crucial at this stage?' },
  { id: 'onboarding', title: 'Onboarding & Initial Use', icon: UserCheck, placeholder: 'What is the experience like after purchase? First steps? Key touchpoints? Potential friction points?' },
  { id: 'engagement', title: 'Engagement & Value Realization', icon: MessageSquare, placeholder: 'How do customers derive ongoing value? How do we maintain engagement? What are common support queries or feedback?' },
  { id: 'advocacy', title: 'Advocacy & Retention', icon: Users, placeholder: 'What makes customers loyal? How can we encourage referrals or testimonials? What are opportunities for upselling or cross-selling?' },
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
            const initialNotes: Record<string, string> = {};
            journeyStages.forEach(stage => initialNotes[stage.id] = journeyNotes[stage.id] || ''); // Preserve existing notes if any
            setJourneyNotes(initialNotes);
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
  }, [serviceId]); // Removed journeyNotes from dependencies to avoid loop on notes change

  const handleNoteChange = (stageId: string, value: string) => {
    setJourneyNotes(prev => ({ ...prev, [stageId]: value }));
  };

  const handleSaveJourney = () => {
    console.log("Saving Journey Notes for Service ID:", serviceId, journeyNotes);
    alert("Save functionality is not implemented yet. Notes logged to console.");
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
    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)]"> {/* Adjust min-h based on your admin layout footer/header */}
      {/* Top Bar: Title and Stepper */}
      <Card className="mb-6 rounded-xl border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
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
              <div className="flex items-center gap-1.5 justify-start md:justify-end pt-2 md:pt-0">
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
                <span>{stage.title}</span>
                {currentStageIndex === index && <stage.icon className="h-4 w-4 ml-auto hidden sm:inline-block" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area (Two Columns) */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stage Configuration */}
        <Card className="lg:col-span-2 rounded-xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <currentStage.icon className="mr-3 h-6 w-6 text-primary" />
              Step {String(currentStageIndex + 1).padStart(2, '0')}: {currentStage.title}
            </CardTitle>
            <CardDescription>{currentStage.placeholder}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <Label htmlFor={`notes-${currentStage.id}`} className="text-sm font-medium text-muted-foreground mb-2">
              Notes & Simulation Details:
            </Label>
            <Textarea
              id={`notes-${currentStage.id}`}
              value={journeyNotes[currentStage.id] || ''}
              onChange={(e) => handleNoteChange(currentStage.id, e.target.value)}
              placeholder={`Enter your notes for the "${currentStage.title}" stage...`}
              rows={15}
              className="bg-background flex-grow resize-none text-base"
            />
          </CardContent>
        </Card>

        {/* Right Column: Contextual Preview */}
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

      {/* Bottom Navigation Bar */}
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

    