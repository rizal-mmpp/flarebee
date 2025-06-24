
'use client';

import React, { useEffect, useState, useCallback, useTransition, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { getServiceBySlugFromFirestore } from '@/lib/firebase/firestoreServices';
import { updateServiceJourneyStagesAction } from '@/lib/actions/service.actions';
import { uploadFileToVercelBlob } from '@/lib/actions/vercelBlob.actions';
import type { Service, JourneyStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Loader2, ServerCrash, Save, Play, ChevronLeft, ChevronRight, 
  ImageIcon, Edit, Trash2, PlusCircle, ArrowUp, ArrowDown,
  Check, AlertTriangle, Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';


const DEFAULT_JOURNEY_STAGES_PLACEHOLDER: JourneyStage[] = []; 

export default function SimulateJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slug = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentStageIndex, setCurrentStageIndex] = useState<number | null>(null);
  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>([]);
  
  const [stageImagePreviews, setStageImagePreviews] = useState<Record<string, string | null>>({}); 
  const [stageImageFiles, setStageImageFiles] = useState<Record<string, File | null | undefined>>({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stageToDeleteIndex, setStageToDeleteIndex] = useState<number | null>(null);

  const [isSavingJourney, startSaveTransition] = useTransition();
  const [isEditModeActive, setIsEditModeActive] = useState(false);

  const [initialJourneyStagesOnEditStart, setInitialJourneyStagesOnEditStart] = useState<JourneyStage[] | null>(null);
  const [initialStageImagePreviewsOnEditStart, setInitialStageImagePreviewsOnEditStart] = useState<Record<string, string | null> | null>(null);
  const [isDiscardConfirmModalOpen, setIsDiscardConfirmModalOpen] = useState(false);
  

  const loadServiceAndJourney = useCallback(async () => {
    if (!slug) return;
    setIsLoadingService(true);
    setError(null);
    try {
      const fetchedService = await getServiceBySlugFromFirestore(slug);
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
        setStageImageFiles({}); 
      } else {
        setError('Service not found.');
        setJourneyStages([]);
        setCurrentStageIndex(null);
      }
    } catch (err) {
      console.error('Failed to fetch service details:', err);
      setError('Failed to load service details. Please try again.');
      setJourneyStages([]);
      setCurrentStageIndex(null);
    } finally {
      setIsLoadingService(false);
    }
  }, [slug]);

  useEffect(() => {
    loadServiceAndJourney();
  }, [loadServiceAndJourney]);
  
  const currentStageData = useMemo(() => {
    return (currentStageIndex !== null && journeyStages[currentStageIndex]) ? journeyStages[currentStageIndex] : null;
  }, [currentStageIndex, journeyStages]);

  const currentStageImagePreviewUrl = useMemo(() => {
    if (currentStageData && stageImageFiles[currentStageData.id] !== undefined) {
        if (stageImageFiles[currentStageData.id] === null) return null; // Explicitly cleared
        return stageImagePreviews[currentStageData.id]; // Object URL or original from initial edit start
    } else if (currentStageData) {
      return currentStageData.imageUrl; // Fallback to the URL stored in the stage data itself
    }
    return null;
  }, [currentStageData, stageImageFiles, stageImagePreviews]);


  const handleStageInputChange = (field: keyof Omit<JourneyStage, 'id' | 'imageUrl' | 'imageFile'>, value: string) => {
    if (currentStageIndex === null || !currentStageData) return;
    const updatedStages = [...journeyStages];
    updatedStages[currentStageIndex] = { ...updatedStages[currentStageIndex], [field]: value };
    setJourneyStages(updatedStages);
  };

  const handleStageImageFileChange = (file: File | null) => {
    if (currentStageIndex === null || !currentStageData) return;
    const stageId = currentStageData.id;
    setStageImageFiles(prev => ({ ...prev, [stageId]: file }));
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setStageImagePreviews(prev => ({ ...prev, [stageId]: objectUrl }));
    } else {
      const originalStageFromInitialLoad = initialJourneyStagesOnEditStart?.find(s => s.id === stageId);
      const originalImageUrl = originalStageFromInitialLoad?.imageUrl || currentStageData.imageUrl || null;
      setStageImagePreviews(prev => ({ ...prev, [stageId]: originalImageUrl }));
    }
  };


  const handleAddNewStage = () => {
    const newStageId = `stage-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newStage: JourneyStage = {
      id: newStageId,
      title: 'New Stage',
      details: '- Add details here...\n- Use Markdown for lists, bold, etc.',
      placeholder: 'Describe mockup elements or considerations for this stage...',
      imageUrl: null,
      imageAiHint: '',
    };
    const updatedStages = [...journeyStages, newStage];
    setJourneyStages(updatedStages);
    setCurrentStageIndex(updatedStages.length - 1);
    setStageImagePreviews(prev => ({ ...prev, [newStageId]: null }));
    setStageImageFiles(prev => ({ ...prev, [newStageId]: undefined }));
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
        const previewUrl = stageImagePreviews[stageToDelete.id];
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        
        setStageImagePreviews(prev => { const newPreviews = {...prev}; delete newPreviews[stageToDelete.id]; return newPreviews; });
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
      const stagesToSave = JSON.parse(JSON.stringify(journeyStages)) as JourneyStage[]; 
      let uploadErrorOccurred = false;
      const newPreviewsAfterSave = { ...stageImagePreviews };

      for (let i = 0; i < stagesToSave.length; i++) {
        const stage = stagesToSave[i];
        const fileToUpload = stageImageFiles[stage.id];

        if (fileToUpload === null) { 
          stagesToSave[i].imageUrl = null;
          newPreviewsAfterSave[stage.id] = null;
        } else if (fileToUpload instanceof File) { 
          try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            const uploadResult = await uploadFileToVercelBlob(formData);
            if (uploadResult.success && uploadResult.data?.url) {
              stagesToSave[i].imageUrl = uploadResult.data.url;
              newPreviewsAfterSave[stage.id] = uploadResult.data.url; 
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
      }

      if (uploadErrorOccurred) {
        return; 
      }
      
      const result = await updateServiceJourneyStagesAction(service.id, stagesToSave);
      if (result.success) {
        toast({ title: 'Journey Saved', description: 'Customer journey stages have been updated.' });
        setJourneyStages(stagesToSave); 
        setStageImagePreviews(newPreviewsAfterSave);
        setStageImageFiles({}); 
        setInitialJourneyStagesOnEditStart(JSON.parse(JSON.stringify(stagesToSave)));
        setInitialStageImagePreviewsOnEditStart({...newPreviewsAfterSave});
      } else {
        toast({ title: 'Error Saving Journey', description: result.error || 'Could not save changes.', variant: 'destructive' });
      }
    });
  };

  const exitEditMode = (discardChanges: boolean) => {
    if (discardChanges && initialJourneyStagesOnEditStart) {
      Object.keys(stageImagePreviews).forEach(stageId => {
        const currentPreview = stageImagePreviews[stageId];
        const initialPreview = initialStageImagePreviewsOnEditStart?.[stageId];
        if (currentPreview && currentPreview.startsWith('blob:') && currentPreview !== initialPreview) {
          URL.revokeObjectURL(currentPreview);
        }
      });
      setJourneyStages(initialJourneyStagesOnEditStart);
      setStageImagePreviews(initialStageImagePreviewsOnEditStart || {});
    }
    setIsEditModeActive(false);
    setStageImageFiles({});
    setInitialJourneyStagesOnEditStart(null);
    setInitialStageImagePreviewsOnEditStart(null);
    setIsDiscardConfirmModalOpen(false);
  };

  const toggleEditMode = () => {
    if (isEditModeActive) { 
      const hasStageDataChanged = JSON.stringify(journeyStages) !== JSON.stringify(initialJourneyStagesOnEditStart);
      const hasImageFilesChanged = Object.values(stageImageFiles).some(file => file !== undefined);

      if (hasStageDataChanged || hasImageFilesChanged) {
        setIsDiscardConfirmModalOpen(true);
      } else {
        exitEditMode(false); 
      }
    } else { 
      setInitialJourneyStagesOnEditStart(JSON.parse(JSON.stringify(journeyStages)));
      setInitialStageImagePreviewsOnEditStart({...stageImagePreviews });
      setIsEditModeActive(true);
    }
  };

  const handleCopyJourney = useCallback(async () => {
    if (journeyStages.length === 0) {
      toast({ title: "Nothing to Copy", description: "There are no journey stages defined.", variant: "destructive" });
      return;
    }
    let journeyText = `Service Journey: ${service?.title || 'Untitled Service'}\n\n`;
    journeyStages.forEach((stage, index) => {
      journeyText += `Stage ${index + 1}: ${stage.title}\n`;
      journeyText += `Details:\n${stage.details || 'No details provided.'}\n`;
      if (stage.imageUrl) {
        journeyText += `Image: ${stage.imageUrl}\n`;
      }
      if (stage.imageAiHint) {
        journeyText += `AI Hint: ${stage.imageAiHint}\n`;
      }
      journeyText += `--------------------\n\n`;
    });

    try {
      await navigator.clipboard.writeText(journeyText);
      toast({ title: "Journey Copied", description: "All stage titles and details copied to clipboard." });
    } catch (err) {
      toast({ title: "Copy Failed", description: "Could not copy journey to clipboard.", variant: "destructive" });
    }
  }, [journeyStages, service?.title, toast]);
  

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
          <Link href={`/admin/services/${slug}`}>
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
                <Button variant="outline" size="icon" onClick={() => router.push(`/admin/services/${slug}`)} disabled={isSavingJourney}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Back to Service Details</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant={isEditModeActive ? "outline" : "outline"} size="icon" onClick={toggleEditMode} disabled={isSavingJourney}>
                  {isEditModeActive ? <Check className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isEditModeActive ? "Done Editing (View Mode)" : "Edit Journey"}</p></TooltipContent>
            </Tooltip>

            {!isEditModeActive && journeyStages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleCopyJourney} disabled={isSavingJourney}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Copy Journey Text</p></TooltipContent>
              </Tooltip>
            )}

            {isEditModeActive && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleAddNewStage} disabled={isSavingJourney}>
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Add New Stage</p></TooltipContent>
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

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <Card className="rounded-xl shadow-sm flex flex-col">
            <CardContent className="p-4 md:p-6 space-y-4 flex-grow overflow-y-auto">
                {currentStageData ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                        {isEditModeActive ? (
                          <Input 
                            value={currentStageData.title}
                            onChange={(e) => handleStageInputChange('title', e.target.value)}
                            className="text-xl md:text-2xl font-semibold flex-grow"
                            placeholder="Stage Title"
                          />
                        ) : (
                          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                            Stage {String(currentStageIndex! + 1).padStart(2, '0')}: {currentStageData.title}
                          </h2>
                        )}
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <Button variant="outline" size="sm" onClick={() => setCurrentStageIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)} disabled={currentStageIndex === 0 || currentStageIndex === null} className="h-9 group">
                                <ChevronLeft className="mr-1.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentStageIndex(prev => prev !== null && prev < journeyStages.length - 1 ? prev + 1 : prev)} disabled={currentStageIndex === null || currentStageIndex === journeyStages.length - 1} className="h-9 group">
                                <ChevronRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </Button>
                        </div>
                    </div>
                    
                    <Card>
                        <CardHeader className="pb-3 pt-4 px-4">
                            <CardTitle className="text-base font-semibold">Visual Mockup / UI Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-3">
                            {isEditModeActive ? (
                                <>
                                    <CustomDropzone
                                        onFileChange={handleStageImageFileChange}
                                        currentFileName={stageImageFiles[currentStageData.id]?.name || currentStageData.imageUrl?.split('/').pop()}
                                        accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.webp', '.avif'] }}
                                        maxSize={1 * 1024 * 1024}
                                    />
                                    <Input 
                                      value={currentStageData.imageAiHint || ''}
                                      onChange={(e) => handleStageInputChange('imageAiHint', e.target.value)}
                                      placeholder="AI Hint for image (e.g., user journey map)"
                                      className="text-sm"
                                    />
                                </>
                            ) : null}
                            
                            {currentStageImagePreviewUrl ? (
                                <div className="relative w-full max-w-full aspect-video rounded-lg overflow-hidden bg-muted mt-2">
                                    <NextImage 
                                        src={currentStageImagePreviewUrl} 
                                        alt={`Preview for ${currentStageData.title}`} 
                                        fill 
                                        className="object-cover"
                                        data-ai-hint={currentStageData.imageAiHint || "journey stage mockup"}
                                    />
                                </div>
                            ) : (
                                <div className={cn("mt-2 p-3 rounded-lg bg-muted/30 min-h-[200px] flex flex-col items-center justify-center text-center", isEditModeActive && "border-2 border-dashed border-input")}>
                                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground mt-2">No preview image for this stage.</p>
                                    {isEditModeActive && <p className="text-xs text-muted-foreground">Upload a mockup using the controls above.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div>
                        <Label htmlFor={`stage-details-${currentStageData.id}`} className="text-base font-semibold text-muted-foreground mb-1 block">Key Elements & Considerations:</Label>
                        {isEditModeActive ? (
                          <Textarea 
                            id={`stage-details-${currentStageData.id}`}
                            value={currentStageData.details}
                            onChange={(e) => handleStageInputChange('details', e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                            placeholder="- Touchpoint: Homepage feature...\n- Key Action: User clicks 'Learn More'..."
                          />
                        ) : currentStageData.details ? (
                           <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 text-muted-foreground prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1">
                             <ReactMarkdown>{currentStageData.details}</ReactMarkdown>
                           </article>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No predefined details for this stage.</p>
                        )}
                    </div>
                  </div>
                ) : (
                 <div className="text-center p-10 h-full flex flex-col items-center justify-center">
                  <ImageIcon className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Journey Stages Defined</h3>
                  <p className="text-sm text-muted-foreground mb-6">This service doesn't have any customer journey stages set up yet.</p>
                  {isEditModeActive ? ( <Button onClick={handleAddNewStage} variant="default"><PlusCircle className="mr-2 h-4 w-4" /> Add First Stage</Button>
                  ) : ( <Button onClick={toggleEditMode} variant="outline"><Edit className="mr-2 h-4 w-4" /> Start Editing Journey</Button> )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="stepper-sidebar" className="rounded-xl shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="py-3 md:py-4 px-4 md:px-5 border-b bg-card sticky top-0 z-10 flex flex-row items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Journey Stages ({journeyStages.length})</h3>
              {isEditModeActive && journeyStages.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => currentStageIndex !== null && handleOpenDeleteModal(currentStageIndex)} disabled={isSavingJourney || !currentStageData || journeyStages.length <= 0} >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>Delete Current Stage</p></TooltipContent>
                </Tooltip>
              )}
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-3">
                {journeyStages.length > 0 ? (
                    <div className="relative space-y-0">
                    {journeyStages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start group py-1 pr-1"> 
                        <div className="flex flex-col items-center mr-3 flex-shrink-0 mt-0.5"> 
                        <div className={cn("flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold border-2 transition-all duration-200 ease-in-out cursor-pointer", 
                            currentStageIndex === index 
                                ? "bg-accent border-accent text-accent-foreground scale-110 shadow-md" 
                                : index < (currentStageIndex ?? -1) 
                                    ? "bg-primary/20 border-primary text-primary" 
                                    : "bg-card border-border text-muted-foreground group-hover:border-primary/70 group-hover:text-primary"
                        )} onClick={() => setCurrentStageIndex(index)}>
                            {String(index + 1).padStart(2, '0')}
                        </div>
                        {index < journeyStages.length - 1 && ( <div className={cn("w-px h-4 my-0.5 transition-colors duration-200", index < (currentStageIndex ?? -1) ? "bg-primary" : "bg-border group-hover:bg-primary/30")}></div> )}
                        </div>
                        <div className={cn("pt-1 pb-1 transition-colors duration-200 flex-grow min-w-0", 
                            currentStageIndex === index 
                                ? "text-accent-foreground font-semibold" 
                                : index < (currentStageIndex ?? -1) 
                                    ? "text-primary/80 font-medium" 
                                    : "text-muted-foreground group-hover:text-foreground"
                        )} onClick={() => setCurrentStageIndex(index)}>
                          <p className="text-sm leading-snug cursor-pointer break-words">{stage.title}</p>
                        </div>
                        {isEditModeActive && (
                            <div className="flex items-center ml-auto pl-1 pt-0 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(index, 'up')} disabled={index === 0 || isSavingJourney}><ArrowUp className="h-4 w-4" /></Button></TooltipTrigger>
                                    <TooltipContent side="left"><p>Move Up</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(index, 'down')} disabled={index === journeyStages.length - 1 || isSavingJourney}><ArrowDown className="h-4 w-4" /></Button></TooltipTrigger>
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

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center"><Trash2 className="mr-2"/>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete the stage "{stageToDeleteIndex !== null && journeyStages[stageToDeleteIndex]?.title}"? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteStage}>Delete Stage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDiscardConfirmModalOpen} onOpenChange={setIsDiscardConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Discard Unsaved Changes?</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You have unsaved changes to the journey stages. Are you sure you want to discard them and exit edit mode?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscardConfirmModalOpen(false)}>Cancel (Keep Editing)</Button>
            <Button variant="destructive" onClick={() => exitEditMode(true)}>Discard Changes & Exit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}
