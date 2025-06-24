'use client';

import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import React from 'react'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardHeader, CardTitle, CardDescription
import { SERVICE_CATEGORIES, PRICING_MODELS, SERVICE_STATUSES } from '@/lib/constants';
import type { ServiceFormValues } from './ServiceFormTypes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { CustomDropzone } from '@/components/ui/custom-dropzone';

interface ServiceFormProps {
  control: Control<ServiceFormValues>;
  register: UseFormRegister<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
  watch: UseFormWatch<ServiceFormValues>; // Added watch
  currentImageUrl?: string | null; 
  onFileChange: (file: File | null) => void; 
  selectedFileName?: string | null; 
  isEditMode?: boolean; // Added isEditMode
}

export function ServiceForm({
  control,
  register,
  errors,
  watch,
  currentImageUrl,
  onFileChange,
  selectedFileName, 
  isEditMode = false,
}: ServiceFormProps) {
  
  const MAX_FILE_SIZE_BYTES = 0.95 * 1024 * 1024; 
  const watchedPricingModel = watch("pricingModel");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Service Details" : "Service Details"}</CardTitle>
        <CardDescription>
          Provide information about the service you are offering. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 space-y-6"> {/* Adjusted pt */}
        <div>
          <Label htmlFor="title">Service Title *</Label>
          <Input id="title" {...register('title')} className="mt-1" placeholder="e.g., Business Profile Website Design"/>
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="shortDescription">Short Description *</Label>
          <Textarea id="shortDescription" {...register('shortDescription')} rows={3} className="mt-1" placeholder="A concise summary of the service (max 150 characters recommended)."/>
          {errors.shortDescription && <p className="text-sm text-destructive mt-1">{errors.shortDescription.message}</p>}
        </div>

        <div>
          <Label htmlFor="longDescription">Detailed Description (Markdown) *</Label>
          <Textarea id="longDescription" {...register('longDescription')} rows={8} className="mt-1" placeholder="Provide a comprehensive description: what's included, process, benefits. Use Markdown for formatting."/>
           {errors.longDescription && <p className="text-sm text-destructive mt-1">{errors.longDescription.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="categoryId">Service Category *</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="categoryId" className={cn("mt-1", errors.categoryId && "border-destructive")}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
          </div>
          <div>
            <Label htmlFor="status">Status *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || 'draft'}>
                  <SelectTrigger id="status" className={cn("mt-1", errors.status && "border-destructive")}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_STATUSES.map(stat => (
                      <SelectItem key={stat} value={stat} className="capitalize">{stat.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div>
                <Label htmlFor="pricingModel">Pricing Model *</Label>
                <Controller
                name="pricingModel"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger id="pricingModel" className={cn("mt-1", errors.pricingModel && "border-destructive")}>
                        <SelectValue placeholder="Select pricing model" />
                    </SelectTrigger>
                    <SelectContent>
                        {PRICING_MODELS.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
                />
                {errors.pricingModel && <p className="text-sm text-destructive mt-1">{errors.pricingModel.message}</p>}
            </div>

            {(watchedPricingModel === "Fixed Price" || watchedPricingModel === "Starting At" || watchedPricingModel === "Hourly" || watchedPricingModel === "Subscription") && (
                 <div>
                    <Label htmlFor="priceMin">
                      {watchedPricingModel === "Fixed Price" && "Price (IDR) *"}
                      {watchedPricingModel === "Starting At" && "Starting Price (IDR) *"}
                      {watchedPricingModel === "Hourly" && "Hourly Rate (IDR) *"}
                      {watchedPricingModel === "Subscription" && "Price per Interval (IDR) *"}
                    </Label>
                    <Input id="priceMin" type="number" step="1000" {...register('priceMin')} className="mt-1" placeholder="e.g., 500000"/>
                    {errors.priceMin && <p className="text-sm text-destructive mt-1">{errors.priceMin.message}</p>}
                </div>
            )}

            {/* Optional PriceMax field if you want to support ranges with "Starting At" or other models */}
            {/* <div>
                <Label htmlFor="priceMax">Price Max (IDR, Optional)</Label>
                <Input id="priceMax" type="number" step="1000" {...register('priceMax')} className="mt-1" placeholder="e.g., 1000000"/>
                {errors.priceMax && <p className="text-sm text-destructive mt-1">{errors.priceMax.message}</p>}
            </div> */}
             <div>
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...register('currency')} className="mt-1 bg-muted" defaultValue="IDR" readOnly />
                {errors.currency && <p className="text-sm text-destructive mt-1">{errors.currency.message}</p>}
            </div>
        </div>


        <div>
          <Label htmlFor="tags">Tags (comma-separated) *</Label>
          <Input id="tags" {...register('tags')} className="mt-1" placeholder="e.g., web design, n8n, openai, small business" />
          {errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}
        </div>
        
        <div>
          <Label>Service Image *</Label>
          <CustomDropzone
            onFileChange={onFileChange}
            currentFileName={selectedFileName}
            accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }}
            maxSize={MAX_FILE_SIZE_BYTES} 
            className="mt-1"
          />
          <input type="hidden" {...register('imageUrl')} />
           {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
        </div>

        {currentImageUrl && (
          <div className="mt-3 p-2 border border-border rounded-lg bg-muted/50 max-w-xs">
            <p className="text-xs text-muted-foreground mb-1">Current/New Image Preview:</p>
            <Image
              src={currentImageUrl}
              alt="Service image preview"
              width={200}
              height={120}
              className="rounded-md object-cover max-h-[120px]"
              data-ai-hint="service image"
            />
          </div>
        )}
         {!currentImageUrl && !selectedFileName && (
           <div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs">
              <ImageIcon className="mx-auto h-8 w-8 mb-1" />
              <p className="text-xs">Upload an image (e.g., service visual, logo collage).</p>
           </div>
         )}

        <div>
          <Label htmlFor="dataAiHint">AI Hint for Image (Optional, 1-2 keywords)</Label>
          <Input id="dataAiHint" {...register('dataAiHint')} className="mt-1" placeholder="e.g., modern website, ai chat" />
          {errors.dataAiHint && <p className="text-sm text-destructive mt-1">{errors.dataAiHint.message}</p>}
        </div>

        <div>
          <Label htmlFor="keyFeatures">Key Features (comma-separated, Optional)</Label>
          <Textarea id="keyFeatures" {...register('keyFeatures')} rows={3} className="mt-1" placeholder="e.g., Responsive Design, SEO Optimized, AI Integration"/>
          {errors.keyFeatures && <p className="text-sm text-destructive mt-1">{errors.keyFeatures.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="targetAudience">Target Audience (comma-separated, Optional)</Label>
          <Textarea id="targetAudience" {...register('targetAudience')} rows={2} className="mt-1" placeholder="e.g., Small Businesses, Startups, Content Creators"/>
          {errors.targetAudience && <p className="text-sm text-destructive mt-1">{errors.targetAudience.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (Optional)</Label>
                <Input id="estimatedDuration" {...register('estimatedDuration')} className="mt-1" placeholder="e.g., 2-4 weeks, 1 month project"/>
                {errors.estimatedDuration && <p className="text-sm text-destructive mt-1">{errors.estimatedDuration.message}</p>}
            </div>
            <div>
                <Label htmlFor="portfolioLink">Portfolio/Case Study Link (Optional)</Label>
                <Input id="portfolioLink" type="url" {...register('portfolioLink')} className="mt-1" placeholder="https://example.com/portfolio/service-name"/>
                {errors.portfolioLink && <p className="text-sm text-destructive mt-1">{errors.portfolioLink.message}</p>}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
