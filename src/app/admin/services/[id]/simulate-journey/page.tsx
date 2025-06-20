
'use client';

import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getServiceByIdFromFirestore } from '@/lib/firebase/firestoreServices';
import { updateServiceJourneyStagesAction } from '@/lib/actions/service.actions';
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
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
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Loader2, ServerCrash, Save, Play, ChevronLeft, ChevronRight, 
  ImageIcon, Edit, Trash2, PlusCircle, ArrowUp, ArrowDown,
  Edit2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stageFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  details: z.string().min(1, 'Details are required (Markdown supported).'),
  placeholder: z.string().optional(),
  imageAiHint: z.string().max(50, "AI Hint too long").optional(),
});
type StageFormValues = z.infer<typeof stageFormSchema>;

const DEFAULT_JOURNEY_STAGES_PLACEHOLDER: JourneyStage[] = [];

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
  
  const [stageImagePreviews, setStageImagePreviews] = useState<Record<string, string | null>>({}); 
  const [stageImageFiles, setStageImageFiles] = useState<Record<string, File | null | undefined>>({});

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [currentEditingStage, setCurrentEditingStage] = useState<JourneyStage | null>(null);
  const [editingStageOriginalIndex, setEditingStageOriginalIndex] = useState<number | null>(null);
  const [modalSelectedFile, setModalSelectedFile] = useState<File | null>(null);


  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stageToDeleteIndex, setStageToDeleteIndex] = useState<number | null>(null);

  const [isSavingJourney, startSaveTransition] = useTransition();
  const [isEditModeActive, setIsEditModeActive] = useState(false);

  const { register: registerStageForm, handleSubmit: handleSubmitStageForm, reset: resetStageForm, formState: { errors: stageFormErrors }, setValue: setStageFormValue } = useForm<StageFormValues>({
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
              : DEFAULT_JOURNEY_STAGES_PLACEHOLDER;
            setJourneyStages(stages);
            if (stages.length > 0) {
              setCurrentStageIndex(0);
            } else {
              setCurrentStageIndex(null);
            }
            const initialPreviews: Record<string, string | null> = {};
            stages.forEach(stage => { initialPreviews[stage.id] = stage.imageUrl || null; });
            setStageImagePreviews(initialPreviews);
            setStageImageFiles({}); // Reset pending file changes on load
          } else {
            setError('Service not found.');
            setJourneyStages([]);
            setCurrentStageIndex(null);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch service details:', err);
          setError('Failed to load service details. Please try again.');
          setJourneyStages([]);
          setCurrentStageIndex(null);
        })
        .finally(() => {
          setIsLoadingService(false);
        });
    }
  }, [serviceId]);
  
  const handleModalImageFileChange = useCallback((file: File | null) => {
    setModalSelectedFile(file);
    if (currentEditingStage) {
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setStageImagePreviews(prev => ({...prev, [currentEditingStage.id]: objectUrl}));
      } else {
        // If cleared, show original image or nothing if no original
        setStageImagePreviews(prev => ({...prev, [currentEditingStage.id]: currentEditingStage.imageUrl || null}));
      }
    }
  }, [currentEditingStage]);

  const handleOpenAddStageModal = () => {
    setCurrentEditingStage(null);
    setEditingStageOriginalIndex(null);
    setModalSelectedFile(null);
    resetStageForm({ title: '', details: '', placeholder: '', imageAiHint: '' });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditStageModal = (stage: JourneyStage, index: number) => {
    setCurrentEditingStage(stage);
    setEditingStageOriginalIndex(index);
    setModalSelectedFile(null); // Reset file selection for the modal
    resetStageForm({
      title: stage.title,
      details: stage.details,
      placeholder: stage.placeholder || '',
      imageAiHint: stage.imageAiHint || '',
    });
    // Pre-fill preview in modal from existing stage data
    setStageImagePreviews(prev => ({...prev, [stage.id]: stage.imageUrl || null}));
    setIsAddEditModalOpen(true);
  };

  const onStageFormSubmit: SubmitHandler<StageFormValues> = (data) => {
    const stageId = currentEditingStage ? currentEditingStage.id : `stage-${Date.now()}-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().substring(0,6) : Math.random().toString(36).substring(2, 8)}`;
    
    const updatedStageData: Partial<JourneyStage> = {
      title: data.title,
      details: data.details,
      placeholder: data.placeholder,
      imageAiHint: data.imageAiHint,
    };

    // Record the file change intent
    if (currentEditingStage) { // Editing existing
      setStageImageFiles(prev => ({...prev, [currentEditingStage.id]: modalSelectedFile}));
    } else { // Adding new
      setStageImageFiles(prev => ({...prev, [stageId]: modalSelectedFile}));
    }
     // Update local preview immediately based on modal's file selection (if any)
    if (modalSelectedFile) {
        // Preview was already set by handleModalImageFileChange
    } else if (currentEditingStage && modalSelectedFile === null) { 
        // If file was explicitly cleared in modal, update preview to reflect (potentially original image)
        setStageImagePreviews(prev => ({ ...prev, [currentEditingStage.id]: currentEditingStage.imageUrl || null }));
    }


    if (currentEditingStage && editingStageOriginalIndex !== null) {
      const updatedStages = journeyStages.map((s, idx) => 
        idx === editingStageOriginalIndex ? { ...s, ...updatedStageData, id: s.id } : s // Keep original ID
      );
      setJourneyStages(updatedStages);
    } else { // Adding new stage
      const newStage: JourneyStage = {
        id: stageId,
        title: data.title,
        details: data.details,
        placeholder: data.placeholder,
        imageUrl: null, // Will be set after upload if a file is selected
        imageAiHint: data.imageAiHint,
      };
      const updatedStages = [...journeyStages, newStage];
      setJourneyStages(updatedStages);
      setCurrentStageIndex(updatedStages.length - 1);
      // Ensure preview state exists for new stage
      if (modalSelectedFile) {
        setStageImagePreviews(prev => ({...prev, [stageId]: URL.createObjectURL(modalSelectedFile)}));
      } else {
         setStageImagePreviews(prev => ({...prev, [stageId]: null}));
      }
    }
    setIsAddEditModalOpen(false);
    setModalSelectedFile(null);
  };

  const handleOpenDeleteModal = (index: number) => {
    setStageToDeleteIndex(index);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStage = () => {
    if (stageToDeleteIndex !== null) {
      const stageToDelete = journeyStages[stageToDeleteIndex];
      const updatedStages = journeyStages.filter((_, idx) => idx !== stageToDeleteIndex);
      setJourneyStages(updatedStages);
      
      if (stageToDelete) {
        if (stageImagePreviews[stageToDelete.id]) URL.revokeObjectURL(stageImagePreviews[stageToDelete.id]!);
        setStageImagePreviews(prev => { const newImages = {...prev}; delete newImages[stageToDelete.id]; return newImages; });
        setStageImageFiles(prev => { const newFiles = {...prev}; delete newFiles[stageToDelete.id]; return newFiles; });
      }

      if (currentStageIndex !== null) {
        if (updatedStages.length === 0) {
          setCurrentStageIndex(null);
        } else if (currentStageIndex === stageToDeleteIndex) {
          setCurrentStageIndex(Math.max(0, stageToDeleteIndex - 1));
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

  const handleSaveChangesToFirestore = async () => {
    if (!service) return;
    startSaveTransition(async () => {
      const stagesToSave = [...journeyStages]; // Create a copy to modify
      let uploadErrorOccurred = false;

      for (let i = 0; i < stagesToSave.length; i++) {
        const stage = stagesToSave[i];
        const fileToUpload = stageImageFiles[stage.id];

        if (fileToUpload === null) { // Image was explicitly cleared
          stagesToSave[i] = { ...stage, imageUrl: null };
        } else if (fileToUpload instanceof File) { // New file selected
          try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            const uploadResult = await uploadFileToVercelBlob(formData);
            if (uploadResult.success && uploadResult.data?.url) {
              stagesToSave[i] = { ...stage, imageUrl: uploadResult.data.url };
            } else {
              toast({ title: `Image Upload Failed for Stage: ${stage.title}`, description: uploadResult.error || 'Could not upload image.', variant: 'destructive' });
              uploadErrorOccurred = true;
              break; 
            }
          } catch (err) {
            toast({ title: `Error Uploading Image for Stage: ${stage.title}`, description: (err as Error).message, variant: 'destructive' });
            uploadErrorOccurred = true;
            break;
          }
        }
        // If stageImageFiles[stage.id] is undefined, it means the image wasn't touched for this stage in this session, so its existing imageUrl is preserved.
      }

      if (uploadErrorOccurred) {
        return; // Stop if an upload failed
      }
      
      const result = await updateServiceJourneyStagesAction(service.id, stagesToSave);
      if (result.success) {
        toast({ title: 'Journey Saved', description: 'Customer journey stages have been updated.' });
        setJourneyStages(stagesToSave); // Update local state with final URLs
        setStageImageFiles({}); // Clear pending file changes
      } else {
        toast({ title: 'Error Saving Journey', description: result.error || 'Could not save changes.', variant: 'destructive' });
      }
    });
  };
  
  const currentStageData = (currentStageIndex !== null && journeyStages[currentStageIndex]) ? journeyStages[currentStageIndex] : null;
  const currentStageImagePreviewUrl = currentStageData ? stageImagePreviews[currentStageData.id] : null;


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
  
  const modalImagePreview = currentEditingStage ? stageImagePreviews[currentEditingStage.id] : null;
  const modalCurrentFileName = modalSelectedFile?.name || (currentEditingStage?.imageUrl ? currentEditingStage.imageUrl.split('/').pop() : undefined);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full min-h-screen">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Play className="h-7 w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
                Customer Journey Simulation
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-tight truncate max-w-xs md:max-w-md">
                For service: <span className="font-medium text-foreground/90">{service?.title || 'Loading...'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => router.push(`/admin/services/${serviceId}`)} disabled={isSavingJourney}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Back to Service Details</p></TooltipContent>
            </Tooltip>

            {isEditModeActive ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsEditModeActive(false)} disabled={isSavingJourney}>
                    <Check className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Done Editing (View Mode)</p></TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" onClick={() => setIsEditModeActive(true)} disabled={isSavingJourney}>
                    <Edit className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Journey</p></TooltipContent>
              </Tooltip>
            )}

            {isEditModeActive && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleOpenAddStageModal} disabled={isSavingJourney}>
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Add New Stage</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => currentStageData && handleOpenEditStageModal(currentStageData, currentStageIndex!)} disabled={isSavingJourney || !currentStageData}>
                      <Edit className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit Current Stage</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => currentStageIndex !== null && handleOpenDeleteModal(currentStageIndex)} disabled={isSavingJourney || !currentStageData || journeyStages.length <= 1}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete Current Stage</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" onClick={handleSaveChangesToFirestore} disabled={isSavingJourney} className="bg-primary hover:bg-primary/90">
                      {isSavingJourney ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Save All Journey Changes</p></TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </header>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          <Card className="rounded-xl shadow-sm flex flex-col">
            <CardContent className="p-4 md:p-6 space-y-4 flex-grow overflow-y-auto">
                {currentStageData ? (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                        <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                          Stage {String(currentStageIndex! + 1).padStart(2, '0')}: {currentStageData.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentStageIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
                            disabled={currentStageIndex === 0 || currentStageIndex === null}
                            className="h-9 group"
                            >
                            <ChevronLeft className="mr-1.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                            </Button>
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentStageIndex(prev => prev !== null && prev < journeyStages.length - 1 ? prev + 1 : prev)}
                            disabled={currentStageIndex === null || currentStageIndex === journeyStages.length - 1}
                            className="h-9 group"
                            >
                            <ChevronRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="mt-1">
                        <h4 className="text-base font-semibold text-muted-foreground mb-2">Key Elements & Considerations:</h4>
                        {currentStageData.details ? (
                           <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 text-muted-foreground">
                             <ReactMarkdown>{currentStageData.details}</ReactMarkdown>
                           </article>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No predefined details for this stage. {isEditModeActive ? 'Add details via "Edit Stage".' : ''}</p>
                        )}
                    </div>
                    
                    <Card className="mt-3">
                        <CardHeader className="pb-3 pt-4 px-4">
                            <CardTitle className="text-base font-semibold">Visual Mockup / UI Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className={cn("mt-1 p-3 border-2 border-dashed border-border/50 rounded-lg bg-muted/20 min-h-[200px] flex flex-col items-center justify-center text-center")}>
                                {currentStageImagePreviewUrl ? (
                                <div className="relative w-full max-w-lg aspect-video mb-3">
                                    <NextImage
                                    src={currentStageImagePreviewUrl}
                                    alt={`Preview for ${currentStageData.title}`}
                                    fill
                                    className="object-contain rounded-md"
                                    data-ai-hint={currentStageData.imageAiHint || "journey stage mockup"}
                                    />
                                </div>
                                ) : (
                                <div className="text-muted-foreground space-y-1.5 py-6">
                                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                    <p className="text-sm">No preview image for this stage.</p>
                                    {isEditModeActive && <p className="text-xs">Edit the stage to upload a mockup.</p>}
                                </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                  </>
                ) : (
                 <div className="text-center p-10 h-full flex flex-col items-center justify-center">
                  <ImageIcon className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Journey Stages Defined</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    This service doesn't have any customer journey stages set up yet.
                  </p>
                  {isEditModeActive ? (
                    <Button onClick={handleOpenAddStageModal} variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add First Stage
                    </Button>
                  ) : (
                     <Button onClick={() => setIsEditModeActive(true)} variant="default">
                        <Edit2 className="mr-2 h-4 w-4" /> Start Editing Journey
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="stepper-sidebar" className="rounded-xl shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="py-3 md:py-4 px-4 md:px-5 border-b bg-card sticky top-0 z-10">
              <h3 className="text-base font-semibold text-foreground">Journey Stages ({journeyStages.length})</h3>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-3">
                {journeyStages.length > 0 ? (
                    <div className="relative space-y-0">
                    {journeyStages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start group py-1">
                        <div className="flex flex-col items-center mr-3 flex-shrink-0 mt-0.5"> 
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
                            "w-px h-4 my-0.5 transition-colors duration-200", 
                            index < (currentStageIndex ?? -1) ? "bg-primary" : "bg-border group-hover:bg-primary/30"
                            )}></div>
                        )}
                        </div>
                        <div className={cn(
                            "pt-1 pb-1 transition-colors duration-200 flex-grow min-w-0", 
                            currentStageIndex === index ? "text-primary font-semibold" : 
                            index < (currentStageIndex ?? -1) ? "text-primary/80 font-medium" :
                            "text-muted-foreground group-hover:text-foreground"
                        )}
                        onClick={() => setCurrentStageIndex(index)}
                        >
                          <p className="text-sm leading-snug cursor-pointer break-words">{stage.title}</p>
                        </div>
                        {isEditModeActive && (
                            <div className="flex items-center ml-auto pl-1 pt-0">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(index, 'up')} disabled={index === 0 || isSavingJourney}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left"><p>Move Up</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(index, 'down')} disabled={index === journeyStages.length - 1 || isSavingJourney}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left"><p>Move Down</p></TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
                ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                        {isEditModeActive ? "No stages defined yet. Click 'Add New Stage' in the top bar to begin." : "No journey stages have been defined for this service."}
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentEditingStage ? 'Edit Journey Stage' : 'Add New Journey Stage'}</DialogTitle>
            <DialogDescription>
              Define the title, details, and optional image for this stage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStageForm(onStageFormSubmit)} className="space-y-4 py-2">
            <div>
              <Label htmlFor="stageTitle">Stage Title</Label>
              <Input id="stageTitle" {...registerStageForm('title')} className="mt-1" placeholder="e.g., Discovery & Awareness"/>
              {stageFormErrors.title && <p className="text-sm text-destructive mt-1">{stageFormErrors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="stageDetails">Key Elements & Considerations (Markdown)</Label>
              <Textarea id="stageDetails" {...registerStageForm('details')} rows={8} className="mt-1" placeholder="- Touchpoint: Homepage feature\n- Action: User clicks 'Learn More'\n- **Goal:** Get user to service page"/>
              {stageFormErrors.details && <p className="text-sm text-destructive mt-1">{stageFormErrors.details.message}</p>}
            </div>
             <div>
              <Label htmlFor="stagePlaceholder">Placeholder for Image Description (Optional)</Label>
              <Textarea id="stagePlaceholder" {...registerStageForm('placeholder')} rows={3} className="mt-1" placeholder="e.g., Describe the visual elements and primary CTA for this step..."/>
            </div>
            <div>
              <Label htmlFor="stageImageAiHint">Image AI Hint (Optional)</Label>
              <Input id="stageImageAiHint" {...registerStageForm('imageAiHint')} className="mt-1" placeholder="e.g., user journey map" />
              {stageFormErrors.imageAiHint && <p className="text-sm text-destructive mt-1">{stageFormErrors.imageAiHint.message}</p>}
            </div>
            <div>
              <Label>Stage Image (Optional)</Label>
               <CustomDropzone
                  onFileChange={handleModalImageFileChange}
                  currentFileName={modalCurrentFileName}
                  accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.webp', '.avif'] }}
                  maxSize={1 * 1024 * 1024} 
                  className="mt-1"
                />
                {modalImagePreview && (
                    <div className="mt-2 p-2 border border-border rounded-md bg-muted/50 max-w-[200px]">
                        <NextImage src={modalImagePreview} alt="Modal image preview" width={200} height={120} className="rounded object-contain max-h-[120px]" />
                    </div>
                )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{currentEditingStage ? 'Save Changes' : 'Add Stage'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

