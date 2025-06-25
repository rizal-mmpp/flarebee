
'use client';

import type { Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';
import React from 'react'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '@/lib/constants';
import type { ServiceFormValues } from './ServiceFormTypes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ImageIcon, Trash2, PlusCircle, DollarSign, HelpCircle, FileText, Settings, Sparkles, Repeat, Package } from 'lucide-react';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';

interface ServiceFormProps {
  control: Control<ServiceFormValues>;
  register: UseFormRegister<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
  watch: UseFormWatch<ServiceFormValues>;
  setValue: UseFormSetValue<ServiceFormValues>;
  getValues: UseFormGetValues<ServiceFormValues>;
  currentImageUrl?: string | null; 
  onFileChange: (file: File | null) => void; 
  selectedFileName?: string | null; 
  currentFixedPriceImageUrl?: string | null;
  onFixedPriceFileChange: (file: File | null) => void;
  selectedFixedPriceFileName?: string | null;
  isEditMode?: boolean;
}

export function ServiceForm({
  control,
  register,
  errors,
  watch,
  setValue,
  getValues,
  currentImageUrl,
  onFileChange,
  selectedFileName, 
  currentFixedPriceImageUrl,
  onFixedPriceFileChange,
  selectedFixedPriceFileName,
  isEditMode = false,
}: ServiceFormProps) {
  
  const MAX_FILE_SIZE_BYTES = 0.95 * 1024 * 1024; 

  const { fields: packageFields, append: appendPackage, remove: removePackage } = useFieldArray({
    control,
    name: "pricing.subscriptionDetails.packages",
  });
  
  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
    control,
    name: "faq",
  });
  
  const watchedPricing = watch('pricing');

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="general"><Settings className="mr-2 h-4 w-4 hidden sm:inline-block"/>General</TabsTrigger>
        <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4 hidden sm:inline-block"/>Content</TabsTrigger>
        <TabsTrigger value="pricing"><DollarSign className="mr-2 h-4 w-4 hidden sm:inline-block"/>Pricing</TabsTrigger>
        <TabsTrigger value="faq"><HelpCircle className="mr-2 h-4 w-4 hidden sm:inline-block"/>FAQ</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card>
          <CardHeader><CardTitle>General Information</CardTitle><CardDescription>Core details that define and categorize the service.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="title">Service Title *</Label><Input id="title" {...register('title')} className="mt-1" placeholder="e.g., Business Profile Website Design"/>{errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="categoryId">Service Category *</Label><Controller name="categoryId" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger id="categoryId" className={cn("mt-1", errors.categoryId && "border-destructive")}><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{SERVICE_CATEGORIES.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select>)}/>{errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}</div>
              <div><Label htmlFor="status">Status *</Label><Controller name="status" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || 'draft'}><SelectTrigger id="status" className={cn("mt-1", errors.status && "border-destructive")}><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map(stat => (<SelectItem key={stat} value={stat} className="capitalize">{stat.replace('_', ' ')}</SelectItem>))}</SelectContent></Select>)}/>{errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}</div>
            </div>
            <div><Label>Service Image *</Label><CustomDropzone onFileChange={onFileChange} currentFileName={selectedFileName} accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }} maxSize={MAX_FILE_SIZE_BYTES} className="mt-1"/><input type="hidden" {...register('imageUrl')} />{errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}</div>
            {currentImageUrl ? (<div className="mt-3 p-2 border border-border rounded-lg bg-muted/50 max-w-xs"><p className="text-xs text-muted-foreground mb-1">Preview:</p><Image src={currentImageUrl} alt="Service image preview" width={200} height={120} style={{objectFit: 'fill'}} className="rounded-md max-h-[120px]" data-ai-hint="service image"/></div>) : !selectedFileName && (<div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs"><ImageIcon className="mx-auto h-8 w-8 mb-1" /><p className="text-xs">Upload an image.</p></div>)}
            <div><Label htmlFor="dataAiHint">AI Hint for Image (Optional)</Label><Input id="dataAiHint" {...register('dataAiHint')} className="mt-1" placeholder="e.g., modern website, ai chat" />{errors.dataAiHint && <p className="text-sm text-destructive mt-1">{errors.dataAiHint.message}</p>}</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="content">
         <Card><CardHeader><CardTitle>Page Content</CardTitle><CardDescription>Detailed descriptions and additional information for the public service page.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="shortDescription">Short Description *</Label><Textarea id="shortDescription" {...register('shortDescription')} rows={3} className="mt-1" placeholder="A concise summary of the service."/>{errors.shortDescription && <p className="text-sm text-destructive mt-1">{errors.shortDescription.message}</p>}</div>
            <div><Label htmlFor="longDescription">Detailed Description (Markdown) *</Label><Textarea id="longDescription" {...register('longDescription')} rows={8} className="mt-1" placeholder="Use Markdown for formatting."/>{errors.longDescription && <p className="text-sm text-destructive mt-1">{errors.longDescription.message}</p>}</div>
            <div><Label htmlFor="keyFeatures">Key Features (comma-separated)</Label><Textarea id="keyFeatures" {...register('keyFeatures')} rows={3} className="mt-1" placeholder="e.g., Feature 1, Feature 2"/>{errors.keyFeatures && <p className="text-sm text-destructive mt-1">{errors.keyFeatures.message}</p>}</div>
            <div><Label htmlFor="targetAudience">Target Audience (comma-separated)</Label><Textarea id="targetAudience" {...register('targetAudience')} rows={2} className="mt-1" placeholder="e.g., Small Businesses, Startups"/>{errors.targetAudience && <p className="text-sm text-destructive mt-1">{errors.targetAudience.message}</p>}</div>
            <div><Label htmlFor="tags">Tags (comma-separated) *</Label><Input id="tags" {...register('tags')} className="mt-1" placeholder="e.g., web design, n8n, openai" />{errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}</div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="estimatedDuration">Estimated Duration</Label><Input id="estimatedDuration" {...register('estimatedDuration')} className="mt-1" placeholder="e.g., 2-4 weeks"/>{errors.estimatedDuration && <p className="text-sm text-destructive mt-1">{errors.estimatedDuration.message}</p>}</div>
                <div><Label htmlFor="portfolioLink">Portfolio Link</Label><Input id="portfolioLink" type="url" {...register('portfolioLink')} className="mt-1" placeholder="https://example.com/portfolio"/>{errors.portfolioLink && <p className="text-sm text-destructive mt-1">{errors.portfolioLink.message}</p>}</div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pricing">
        <Card>
            <CardHeader><CardTitle>Pricing Models</CardTitle><CardDescription>Activate and configure one or more pricing models for this service.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                {/* One-Time Project / Fixed Price */}
                <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="isFixedPriceActive" className="flex items-center gap-2 text-base font-semibold"><Package className="h-5 w-5 text-primary"/>One-Time Project</Label>
                        <Controller name="pricing.isFixedPriceActive" control={control} render={({ field }) => <Switch id="isFixedPriceActive" checked={field.value} onCheckedChange={field.onChange} />} />
                    </div>
                    {watchedPricing?.isFixedPriceActive && (
                        <div className="pl-7 space-y-4">
                             <div><Label htmlFor="fixedPriceBgClassName">Background Color</Label><Controller name="pricing.fixedPriceDetails.bgClassName" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || 'bg-background'}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="bg-background">Background</SelectItem><SelectItem value="bg-card">Card</SelectItem></SelectContent></Select>)} /></div>
                             <div><Label htmlFor="fixedPriceTitle">Display Title</Label><Input {...register('pricing.fixedPriceDetails.title')} className="mt-1" placeholder="e.g., One-Time Project"/></div>
                             <div><Label htmlFor="fixedPriceDescription">Description</Label><Textarea {...register('pricing.fixedPriceDetails.description')} rows={2} className="mt-1" placeholder="e.g., A single payment for a defined scope of work."/></div>
                             <div><Label htmlFor="fixedPricePrice">Price (IDR)</Label><Input {...register('pricing.fixedPriceDetails.price', { valueAsNumber: true })} type="number" className="mt-1" placeholder="e.g., 500000"/>{errors.pricing?.fixedPriceDetails?.price && <p className="text-sm text-destructive mt-1">{errors.pricing.fixedPriceDetails.price.message}</p>}</div>
                             <div><Label>Display Image (Optional)</Label><CustomDropzone onFileChange={onFixedPriceFileChange} currentFileName={selectedFixedPriceFileName} accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.webp'] }} maxSize={MAX_FILE_SIZE_BYTES} className="mt-1"/><input type="hidden" {...register('pricing.fixedPriceDetails.imageUrl')} /></div>
                             {currentFixedPriceImageUrl && (<div className="mt-3 p-2 border rounded-lg bg-muted/50 max-w-xs"><p className="text-xs text-muted-foreground mb-1">Preview:</p><Image src={currentFixedPriceImageUrl} alt="Fixed price image preview" width={150} height={100} style={{objectFit: 'cover'}} className="rounded-md"/></div>)}
                             <div><Label htmlFor="fixedPriceAiHint">AI Hint for Image</Label><Input {...register('pricing.fixedPriceDetails.imageAiHint')} className="mt-1" placeholder="e.g., project deliverable"/></div>
                        </div>
                    )}
                </div>
                
                {/* Subscription Model */}
                <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="isSubscriptionActive" className="flex items-center gap-2 text-base font-semibold"><Repeat className="h-5 w-5 text-primary"/>Subscription Plans</Label>
                        <Controller name="pricing.isSubscriptionActive" control={control} render={({ field }) => <Switch id="isSubscriptionActive" checked={field.value} onCheckedChange={field.onChange} />} />
                    </div>
                     {watchedPricing?.isSubscriptionActive && (
                        <div className="pl-7 space-y-6">
                            <div><Label htmlFor="subscriptionBgClassName">Background Color</Label><Controller name="pricing.subscriptionDetails.bgClassName" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || 'bg-card'}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="bg-background">Background</SelectItem><SelectItem value="bg-card">Card</SelectItem></SelectContent></Select>)} /></div>
                            <Separator/>
                             <Label className="text-md font-medium mb-2 block">Subscription Packages ({packageFields.length})</Label>
                            {packageFields.map((item, index) => {
                                const currentPackage = watch(`pricing.subscriptionDetails.packages.${index}`);
                                return (
                                    <Card key={item.id} className="p-4 bg-muted/50">
                                        <div className="flex justify-between items-center mb-4"><p className="font-semibold">Package #{index + 1}</p><Button type="button" variant="ghost" size="icon" onClick={() => removePackage(index)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4"/></Button></div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div><Label htmlFor={`packages.${index}.name`}>Name</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.name`)} className="mt-1" placeholder="e.g., Basic, Pro"/>{errors.pricing?.subscriptionDetails?.packages?.[index]?.name && <p className="text-sm text-destructive mt-1">{errors.pricing.subscriptionDetails.packages[index]?.name?.message}</p>}</div>
                                                <div className="flex items-center space-x-2 pt-6"><Controller name={`pricing.subscriptionDetails.packages.${index}.isPopular`} control={control} render={({ field }) => <Switch id={`packages.${index}.isPopular`} checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor={`packages.${index}.isPopular`}>Most Popular?</Label></div>
                                            </div>
                                             <div><Label htmlFor={`packages.${index}.description`}>Description</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.description`)} className="mt-1" placeholder="Best for small projects"/>{errors.pricing?.subscriptionDetails?.packages?.[index]?.description && <p className="text-sm text-destructive mt-1">{errors.pricing.subscriptionDetails.packages[index]?.description?.message}</p>}</div>
                                             
                                            <Separator />
                                            <h4 className="text-sm font-medium">Pricing</h4>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div><Label htmlFor={`packages.${index}.priceMonthly`}>Monthly Price (IDR)</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.priceMonthly`, { valueAsNumber: true })} type="number" className="mt-1" placeholder="e.g., 100000"/>{errors.pricing?.subscriptionDetails?.packages?.[index]?.priceMonthly && <p className="text-sm text-destructive mt-1">{errors.pricing.subscriptionDetails.packages[index]?.priceMonthly?.message}</p>}</div>
                                                <div><Label htmlFor={`packages.${index}.originalPriceMonthly`}>Original Monthly Price (IDR)</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.originalPriceMonthly`, { valueAsNumber: true })} type="number" className="mt-1" placeholder="Optional, for discounts"/></div>
                                            </div>
                                            
                                            <div>
                                                <Label>Annual Price Calculation Method</Label>
                                                <Controller
                                                    name={`pricing.subscriptionDetails.packages.${index}.annualPriceCalcMethod`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value || 'percentage'}>
                                                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select calculation method" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="percentage">By Percentage Discount</SelectItem>
                                                                <SelectItem value="fixed">By Fixed Annual Price</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>

                                            {currentPackage?.annualPriceCalcMethod === 'percentage' ? (
                                                <div><Label htmlFor={`packages.${index}.annualDiscountPercentage`}>Annual Discount (%)</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.annualDiscountPercentage`, { valueAsNumber: true })} type="number" className="mt-1" placeholder="e.g., 15 for 15%"/></div>
                                            ) : (
                                                 <div><Label htmlFor={`packages.${index}.priceAnnually`}>Fixed Annual Price (IDR)</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.priceAnnually`, { valueAsNumber: true })} type="number" className="mt-1" placeholder="e.g., 1000000"/></div>
                                            )}

                                            <Separator />

                                            <div><Label htmlFor={`packages.${index}.features`}>Features (comma-separated)</Label><Textarea {...register(`pricing.subscriptionDetails.packages.${index}.features`)} className="mt-1" rows={3} placeholder="Feature A, Feature B, -Excluded Feature C"/>{errors.pricing?.subscriptionDetails?.packages?.[index]?.features && <p className="text-sm text-destructive mt-1">{errors.pricing.subscriptionDetails.packages[index]?.features?.message}</p>}</div>
                                            <div><Label htmlFor={`packages.${index}.cta`}>CTA Text</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.cta`)} className="mt-1" placeholder="e.g., Get Started, Choose Pro"/>{errors.pricing?.subscriptionDetails?.packages?.[index]?.cta && <p className="text-sm text-destructive mt-1">{errors.pricing.subscriptionDetails.packages[index]?.cta?.message}</p>}</div>
                                            <div><Label htmlFor={`packages.${index}.renewalInfo`}>Renewal Info (Optional)</Label><Input {...register(`pricing.subscriptionDetails.packages.${index}.renewalInfo`)} className="mt-1" placeholder="e.g., Renews at full price"/></div>
                                        </div>
                                    </Card>
                                );
                            })}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendPackage({ id: `pkg-${Date.now()}${Math.random().toString(36).substring(2, 8)}`, name: '', description: '', priceMonthly: 0, originalPriceMonthly: 0, annualPriceCalcMethod: 'percentage', annualDiscountPercentage: 0, priceAnnually: 0, features: '', isPopular: false, cta: 'Choose Plan' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Package</Button>
                        </div>
                    )}
                </div>

                {/* Custom Quote Model */}
                 <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="isCustomQuoteActive" className="flex items-center gap-2 text-base font-semibold"><Sparkles className="h-5 w-5 text-primary"/>Custom Quote</Label>
                        <Controller name="pricing.isCustomQuoteActive" control={control} render={({ field }) => <Switch id="isCustomQuoteActive" checked={field.value} onCheckedChange={field.onChange} />} />
                    </div>
                     {watchedPricing?.isCustomQuoteActive && (
                        <div className="pl-7 space-y-4">
                             <div><Label htmlFor="customQuoteBgClassName">Background Color</Label><Controller name="pricing.customQuoteDetails.bgClassName" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || 'bg-background'}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="bg-background">Background</SelectItem><SelectItem value="bg-card">Card</SelectItem></SelectContent></Select>)} /></div>
                             <div><Label htmlFor="customQuoteTitle">Section Title</Label><Input {...register('pricing.customQuoteDetails.title')} className="mt-1" placeholder="e.g., Still not sure?"/></div>
                             <div><Label htmlFor="customQuoteText">Introductory Text</Label><Textarea {...register('pricing.customQuoteDetails.text')} rows={3} className="mt-1" placeholder="e.g., Tell us about your project..."/></div>
                             <div><Label htmlFor="customQuoteInfoBoxText">Info Box Text (Optional)</Label><Textarea {...register('pricing.customQuoteDetails.infoBoxText')} rows={2} className="mt-1" placeholder="e.g., Our team will analyze your needs..."/></div>
                             <Separator />
                             <div><Label htmlFor="customQuoteFormTitle">Form Title</Label><Input {...register('pricing.customQuoteDetails.formTitle')} className="mt-1" placeholder="e.g., Describe Your Project"/></div>
                             <div><Label htmlFor="customQuoteFormDescription">Form Description</Label><Textarea {...register('pricing.customQuoteDetails.formDescription')} rows={2} className="mt-1" placeholder="e.g., The more details you provide..."/></div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="faq">
         <Card>
            <CardHeader><CardTitle>Frequently Asked Questions</CardTitle><CardDescription>Add questions and answers to help customers.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2"><Controller name="showFaqSection" control={control} render={({ field }) => <Switch id="showFaqSection" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="showFaqSection">Show FAQ Section on Public Page</Label></div>
                 {watch('showFaqSection') && (
                    <div className="space-y-4 pt-4 border-t">
                        {faqFields.map((item, index) => (
                        <Card key={item.id} className="p-4 bg-muted/50">
                             <div className="flex justify-between items-center mb-4"><p className="font-semibold">FAQ #{index + 1}</p><Button type="button" variant="ghost" size="icon" onClick={() => removeFaq(index)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4"/></Button></div>
                             <div className="space-y-4">
                                <input type="hidden" {...register(`faq.${index}.id`)} />
                                <div><Label htmlFor={`faq.${index}.q`}>Question</Label><Input {...register(`faq.${index}.q`)} className="mt-1" placeholder="e.g., What is the turnaround time?"/>{errors.faq?.[index]?.q && <p className="text-sm text-destructive mt-1">{errors.faq[index]?.q?.message}</p>}</div>
                                <div><Label htmlFor={`faq.${index}.a`}>Answer</Label><Textarea {...register(`faq.${index}.a`)} className="mt-1" rows={3} placeholder="e.g., Typically 2-4 weeks, depending on complexity."/>{errors.faq?.[index]?.a && <p className="text-sm text-destructive mt-1">{errors.faq[index]?.a?.message}</p>}</div>
                             </div>
                        </Card>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendFaq({ id: `faq-${Date.now()}`, q: '', a: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add FAQ</Button>
                    </div>
                )}
            </CardContent>
         </Card>
      </TabsContent>

    </Tabs>
  );
}
