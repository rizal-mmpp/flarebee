
'use client';

import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { randomUUID } from 'crypto';

import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import { updateServiceJourneyStagesAction } from '@/lib/actions/service.actions';
import type { Service, JourneyStage } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Loader2, ServerCrash, Save, Play, ChevronLeft, ChevronRight, 
  UploadCloud, Image as ImageIcon, Edit, Trash2, PlusCircle, ArrowUp, ArrowDown,
  Edit2, Check, Eye // Added Edit2, Check, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stageFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  details: z.string().min(1, 'Details are required (one per line).'),
  placeholder: z.string().optional(),
});
type StageFormValues = z.infer<typeof stageFormSchema>;

// Default stages if none are found in Firestore for the service
const DEFAULT_JOURNEY_STAGES: JourneyStage[] = []; // Start with empty, user must add.

export default function SimulateJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentStageIndex, setCurrentStageIndex] = useState<number | null>(null);
  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>([]);
  const [stageImages, setStageImages] = useState<Record<string, string | null>>({}); 
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<JourneyStage | null>(null);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stageToDeleteIndex, setStageToDeleteIndex] = useState<number | null>(null);

  const [isSavingJourney, startSaveTransition] = useTransition();
  const [isEditModeActive, setIsEditModeActive] = useState(false); // New state for edit mode

  const { register: registerStageForm, handleSubmit: handleSubmitStageForm, reset: resetStageForm, formState: { errors: stageFormErrors } } = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
  });

  useEffect(() => {
    if (serviceId) {
      setIsLoadingService(true);
      setError(null);
      getServiceByIdFromFirestore(serviceId)
        .then((fetchedService) => {
          if (fetchedService) {
            setService(fetchedService);
            const stages = fetchedService.customerJourneyStages && fetchedService.customerJourneyStages.length > 0
              ? fetchedService.customerJourneyStages
              : DEFAULT_JOURNEY_STAGES;
            setJourneyStages(stages);
            if (stages.length > 0) {
              setCurrentStageIndex(0);
            } else {
              setCurrentStageIndex(null);
            }
            const initialImages: Record<string, string | null> = {};
            // In a real app, you'd load actual image URLs from Firestore if they were saved
            stages.forEach(stage => { initialImages[stage.id] = null; });
            setStageImages(initialImages);
            setSelectedFiles({});
          } else {
            setError('Service not found.');
            setJourneyStages(DEFAULT_JOURNEY_STAGES);
            setCurrentStageIndex(DEFAULT_JOURNEY_STAGES.length > 0 ? 0 : null);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service details:', err);
          setError('Failed to load service details. Please try again.');
          setJourneyStages(DEFAULT_JOURNEY_STAGES);
          setCurrentStageIndex(DEFAULT_JOURNEY_STAGES.length > 0 ? 0 : null);
        })
        .finally(() => {
          setIsLoadingService(false);
        });
    }
  }, [serviceId]);

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
  
  const handleOpenAddStageModal = () => {
    setEditingStage(null);
    setEditingStageIndex(null);
    resetStageForm({ title: '', details: '', placeholder: '' });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditStageModal = (stage: JourneyStage, index: number) => {
    setEditingStage(stage);
    setEditingStageIndex(index);
    resetStageForm({
      title: stage.title,
      details: stage.details.join('\n'),
      placeholder: stage.placeholder || '',
    });
    setIsAddEditModalOpen(true);
  };

  const onStageFormSubmit: SubmitHandler<StageFormValues> = (data) => {
    const newStageDetails = data.details.split('\n').map(d => d.trim()).filter(d => d);
    if (editingStage && editingStageIndex !== null) {
      const updatedStages = journeyStages.map((s, idx) => 
        idx === editingStageIndex 
        ? { ...s, title: data.title, details: newStageDetails, placeholder: data.placeholder } 
        : s
      );
      setJourneyStages(updatedStages);
    } else {
      const newStage: JourneyStage = {
        id: `stage-${Date.now()}-${randomUUID().substring(0,6)}`,
        title: data.title,
        details: newStageDetails,
        placeholder: data.placeholder,
      };
      const updatedStages = [...journeyStages, newStage];
      setJourneyStages(updatedStages);
      setCurrentStageIndex(updatedStages.length - 1);
    }
    setIsAddEditModalOpen(false);
  };

  const handleOpenDeleteModal = (index: number) => {
    setStageToDeleteIndex(index);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStage = () => {
    if (stageToDeleteIndex !== null) {
      const updatedStages = journeyStages.filter((_, idx) => idx !== stageToDeleteIndex);
      setJourneyStages(updatedStages);
      
      if (currentStageIndex !== null) {
        if (currentStageIndex === stageToDeleteIndex) {
          setCurrentStageIndex(updatedStages.length > 0 ? Math.max(0, stageToDeleteIndex - 1) : null);
        } else if (currentStageIndex > stageToDeleteIndex) {
          setCurrentStageIndex(currentStageIndex - 1);
        }
      }
    }
    setIsDeleteModalOpen(false);
    setStageToDeleteIndex(null);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newStages = [...journeyStages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    setJourneyStages(newStages);
    if (currentStageIndex === index) {
      setCurrentStageIndex(targetIndex);
    } else if (currentStageIndex === targetIndex) {
      setCurrentStageIndex(index);
    }
  };

  const handleSaveChangesToFirestore = () => {
    if (!service) return;
    startSaveTransition(async () => {
      // For now, image upload to blob and updating service.customerJourneyImages is not implemented here.
      // This save action only persists the structure and text of journeyStages.
      console.log("Saving Journey Stages (structure & text) to Firestore:", journeyStages);
      
      const result = await updateServiceJourneyStagesAction(service.id, journeyStages);
      if (result.success) {
        toast({ title: 'Journey Saved', description: 'Customer journey stages have been updated.' });
        setIsEditModeActive(false); // Exit edit mode on successful save
      } else {
        toast({ title: 'Error Saving Journey', description: result.error || 'Could not save changes.', variant: 'destructive' });
      }
    });
  };
  
  const currentStage = (currentStageIndex !== null && journeyStages[currentStageIndex]) ? journeyStages[currentStageIndex] : null;
  const currentStageImagePreview = currentStage ? stageImages[currentStage.id] : null;
  const currentSelectedFile = currentStage ? selectedFiles[currentStage.id] : null;

  if (isLoadingService) {
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

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Data Not Available</h2>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full min-h-[calc(100vh-theme(spacing.16))]">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => router.push(`/admin/services/${serviceId}`)} disabled={isSavingJourney}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Back to Service Details</p></TooltipContent>
            </Tooltip>

            {!isEditModeActive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsEditModeActive(true)} disabled={isSavingJourney}>
                    <Edit2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Journey</p></TooltipContent>
              </Tooltip>
            )}

            {isEditModeActive && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setIsEditModeActive(false)} disabled={isSavingJourney}>
                      <Check className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Done Editing (View Mode)</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleOpenAddStageModal} disabled={isSavingJourney}>
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Add New Stage</p></TooltipContent>
                </Tooltip>
                {currentStage && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleOpenEditStageModal(currentStage, currentStageIndex!)} disabled={isSavingJourney}>
                          <Edit className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Edit Current Stage</p></TooltipContent>
                    </Tooltip>
                    {journeyStages.length > 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => handleOpenDeleteModal(currentStageIndex!)} disabled={isSavingJourney} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete Current Stage</p></TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" onClick={handleSaveChangesToFirestore} disabled={isSavingJourney || journeyStages.length === 0} className="bg-primary hover:bg-primary/90">
                      {isSavingJourney ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Save All Journey Changes</p></TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0 md:gap-px bg-border">
          {/* Left Column: Stage Content */}
          <main className="md:col-span-2 lg:col-span-3 p-4 md:p-6 space-y-6 overflow-y-auto bg-background">
            {currentStage ? (
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="pb-4 pt-5 px-5">
                  <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">
                    Stage {String(currentStageIndex! + 1).padStart(2, '0')}: {currentStage.title}
                  </CardTitle>
                   <div className="flex items-center gap-3 mt-3">
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStageIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
                          disabled={currentStageIndex === 0 || currentStageIndex === null}
                          className="h-9 px-4 group"
                      >
                          <ChevronLeft className="mr-1.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Previous
                      </Button>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStageIndex(prev => prev !== null && prev < journeyStages.length - 1 ? prev + 1 : prev)}
                          disabled={currentStageIndex === null || currentStageIndex === journeyStages.length - 1}
                          className="h-9 px-4 group"
                      >
                          Next <ChevronRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 space-y-5 px-5 pb-5">
                  <div>
                    <h4 className="text-base font-semibold text-muted-foreground mb-2">Key Elements & Considerations:</h4>
                    {currentStage.details.length > 0 ? (
                        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-outside pl-5">
                        {currentStage.details.map((detail, idx) => (
                            <li key={idx} className="leading-relaxed">{detail}</li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No predefined details for this stage. {isEditModeActive ? 'Click "Edit Stage" to add them.' : ''}</p>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor={`image-upload-${currentStage.id}`} className="text-base font-semibold text-muted-foreground mb-2 block">
                        Visual Mockup / UI Preview for this Stage:
                    </Label>
                    <div className={cn("mt-1 p-3 border-2 border-dashed border-border/50 rounded-lg bg-muted/20 min-h-[200px] flex flex-col items-center justify-center text-center", !isEditModeActive && !currentStageImagePreview && "py-10")}>
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
                        <div className="text-muted-foreground space-y-1.5">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                            <p className="text-sm">No preview image uploaded for this stage.</p>
                            {isEditModeActive && <p className="text-xs">Upload a mockup or UI screenshot.</p>}
                        </div>
                        )}
                        {isEditModeActive && (
                            <CustomDropzone
                                id={`image-upload-${currentStage.id}`}
                                onFileChange={(file) => handleImageFileChange(currentStage.id, file)}
                                currentFileName={currentSelectedFile?.name}
                                accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }}
                                maxSize={1 * 1024 * 1024} 
                                className="w-full max-w-md mt-3"
                            />
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-xl shadow-sm h-full flex flex-col items-center justify-center">
                <CardContent className="text-center p-10">
                  <ImageIcon className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Journey Stages Defined</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    This service doesn't have any customer journey stages set up yet.
                  </p>
                  {isEditModeActive && (
                    <Button onClick={handleOpenAddStageModal} variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add First Stage
                    </Button>
                  )}
                  {!isEditModeActive && (
                     <Button onClick={() => setIsEditModeActive(true)} variant="default">
                        <Edit2 className="mr-2 h-4 w-4" /> Start Editing Journey
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </main>

          {/* Right Column: Vertical Stepper */}
          <Card as="aside" className="md:col-span-1 lg:col-span-1 p-0 md:border-l md:border-t-0 border-t border-border overflow-y-auto rounded-none md:rounded-r-xl md:rounded-bl-none shadow-sm bg-card">
            <div className="sticky top-0 py-3 md:py-4 bg-card z-10 px-4 md:px-6 border-b border-border/50">
              <h3 className="text-base font-semibold text-foreground">Journey Stages ({journeyStages.length})</h3>
            </div>
            {journeyStages.length > 0 ? (
                <div className="relative space-y-0 p-4 md:p-6">
                {journeyStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-start group">
                    <div className="flex flex-col items-center mr-3 flex-shrink-0 mt-0.5"> {/* Adjusted mt */}
                      <div
                        className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold border-2 transition-all duration-200 ease-in-out cursor-pointer",
                          currentStageIndex === index ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md" : 
                          index < (currentStageIndex ?? -1) ? "bg-primary/20 border-primary text-primary" : 
                          "bg-card border-border text-muted-foreground group-hover:border-primary/70 group-hover:text-primary"
                        )}
                        onClick={() => setCurrentStageIndex(index)}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      {index < journeyStages.length - 1 && (
                        <div className={cn(
                          "w-px h-4 my-0.5 transition-colors duration-200", // Reduced height and margin
                          index < (currentStageIndex ?? -1) ? "bg-primary" : "bg-border group-hover:bg-primary/30"
                        )}></div>
                      )}
                    </div>
                    <div className={cn(
                        "pt-1 pb-1 transition-colors duration-200 flex-grow min-w-0", // Reduced padding
                        currentStageIndex === index ? "text-primary font-semibold" : 
                        index < (currentStageIndex ?? -1) ? "text-primary/80 font-medium" :
                        "text-muted-foreground group-hover:text-foreground"
                      )}
                      onClick={() => setCurrentStageIndex(index)}
                    >
                      <p className="text-sm leading-tight cursor-pointer truncate" title={stage.title}>{stage.title}</p>
                    </div>
                    {isEditModeActive && (
                        <div className="flex items-center ml-auto pl-2 pt-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(index, 'up')} disabled={index === 0 || isSavingJourney}>
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(index, 'down')} disabled={index === journeyStages.length - 1 || isSavingJourney}>
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                    {isEditModeActive ? "No stages defined yet. Click 'Add New Stage' to begin." : "No journey stages have been defined for this service."}
                </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add/Edit Stage Modal */}
      <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit Journey Stage' : 'Add New Journey Stage'}</DialogTitle>
            <DialogDescription>
              Define the title, key details (one per line), and an optional placeholder for notes for this stage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStageForm(onStageFormSubmit)} className="space-y-4 py-2">
            <div>
              <Label htmlFor="stageTitle">Stage Title</Label>
              <Input id="stageTitle" {...registerStageForm('title')} className="mt-1" placeholder="e.g., Discovery & Awareness"/>
              {stageFormErrors.title && <p className="text-sm text-destructive mt-1">{stageFormErrors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="stageDetails">Key Details (one per line)</Label>
              <Textarea id="stageDetails" {...registerStageForm('details')} rows={5} className="mt-1" placeholder="Touchpoint: Homepage feature\nAction: User clicks 'Learn More'"/>
              {stageFormErrors.details && <p className="text-sm text-destructive mt-1">{stageFormErrors.details.message}</p>}
            </div>
            <div>
              <Label htmlFor="stagePlaceholder">Placeholder for Image Description (Optional)</Label>
              <Textarea id="stagePlaceholder" {...registerStageForm('placeholder')} rows={3} className="mt-1" placeholder="e.g., Describe the visual elements and primary CTA for this step..."/>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{editingStage ? 'Save Changes' : 'Add Stage'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Stage Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center"><Trash2 className="mr-2"/>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete the stage "{stageToDeleteIndex !== null && journeyStages[stageToDeleteIndex]?.title}"? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={confirmDeleteStage}>Delete Stage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

