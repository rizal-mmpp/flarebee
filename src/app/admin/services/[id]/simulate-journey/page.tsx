
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, ServerCrash, Brain, CheckSquare, Edit2, MessageSquare, UserCheck, Users, ShieldQuestion, Sparkles, RotateCcw } from 'lucide-react';

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
  const [journeyNotes, setJourneyNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (serviceId) {
      setIsLoading(true);
      setError(null);
      getServiceByIdFromFirestore(serviceId)
        .then((fetchedService) => {
          if (fetchedService) {
            setService(fetchedService);
            // Here you could potentially load saved journey notes if they existed
            // For now, initialize empty notes
            const initialNotes: Record<string, string> = {};
            journeyStages.forEach(stage => initialNotes[stage.id] = '');
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
  }, [serviceId]);

  const handleNoteChange = (stageId: string, value: string) => {
    setJourneyNotes(prev => ({ ...prev, [stageId]: value }));
  };

  const handleSaveJourney = () => {
    // Placeholder for saving logic
    console.log("Saving Journey Notes:", journeyNotes);
    // In a real app, you would save `journeyNotes` associated with `serviceId` to Firestore
    alert("Save functionality is not implemented yet. Notes logged to console.");
  };
  
  const handleResetJourney = () => {
    const initialNotes: Record<string, string> = {};
    journeyStages.forEach(stage => initialNotes[stage.id] = '');
    setJourneyNotes(initialNotes);
    alert("Journey notes reset on this page. No data was saved or deleted from a server.");
  };

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
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Service Details
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
          <Link href="/admin/services">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4"> {/* Changed: Main header container now flex-col */}
        <div> {/* Title and subtitle block */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
                <Brain className="mr-3 h-8 w-8 text-primary" />
                Customer Journey Simulation
            </h1>
            <p className="text-muted-foreground mt-1">For service: <span className="font-semibold text-foreground">{service.title}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-3"> {/* Changed: Button group now uses flex-wrap */}
            <Button variant="outline" onClick={() => router.push(`/admin/services/${serviceId}`)} className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Back to Service
            </Button>
            <Button variant="outline" onClick={handleResetJourney} className="group">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Notes
            </Button>
            <Button onClick={handleSaveJourney} className="group bg-primary/80 hover:bg-primary/90">
                <Edit2 className="mr-2 h-4 w-4" /> Save Journey (Dev Log)
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journey Stages & Notes</CardTitle>
          <CardDescription>
            Outline potential customer thoughts, actions, and touchpoints at each stage for the "{service.title}" service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={journeyStages.map(s => s.id)} className="w-full space-y-2">
            {journeyStages.map((stage) => (
              <AccordionItem key={stage.id} value={stage.id} className="border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-3">
                  <div className="flex items-center">
                    <stage.icon className="mr-3 h-5 w-5 text-primary" />
                    {stage.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${stage.id}`} className="text-sm font-medium text-muted-foreground">
                      Notes / Simulation Details for {stage.title}:
                    </Label>
                    <Textarea
                      id={`notes-${stage.id}`}
                      value={journeyNotes[stage.id] || ''}
                      onChange={(e) => handleNoteChange(stage.id, e.target.value)}
                      placeholder={stage.placeholder}
                      rows={5}
                      className="bg-background"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter className="flex justify-end pt-6 border-t">
             <Button onClick={handleSaveJourney} className="group bg-primary hover:bg-primary/90">
                <Edit2 className="mr-2 h-4 w-4" /> Save Journey Simulation (Dev Log)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

