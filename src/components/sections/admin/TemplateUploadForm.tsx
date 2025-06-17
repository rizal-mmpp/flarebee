
'use client';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import React from 'react'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import type { TemplateFormValues } from './TemplateFormTypes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { CustomDropzone } from '@/components/ui/custom-dropzone'; // Import CustomDropzone

interface TemplateUploadFormProps {
  control: Control<TemplateFormValues>;
  register: UseFormRegister<TemplateFormValues>;
  errors: FieldErrors<TemplateFormValues>;
  currentImageUrl?: string | null; // For image preview
  onFileChange: (file: File | null) => void; // Callback for when a file is selected/cleared
  selectedFileName?: string | null; // Name of the currently selected/existing file
}

export function TemplateUploadForm({
  control,
  register,
  errors,
  currentImageUrl,
  onFileChange,
  selectedFileName, 
}: TemplateUploadFormProps) {
  
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} className="mt-1" />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="description">Short Description</Label>
          <Textarea id="description" {...register('description')} rows={3} className="mt-1" />
          {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <Label htmlFor="longDescription">Long Description (Optional)</Label>
          <Textarea id="longDescription" {...register('longDescription')} rows={5} className="mt-1" />
           {errors.longDescription && <p className="text-sm text-destructive mt-1">{errors.longDescription.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger
                    id="categoryId"
                    className={cn(
                      "mt-1",
                      errors.categoryId && "border-destructive ring-1 ring-destructive focus:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
          </div>
          <div>
            <Label htmlFor="price">Price (IDR)</Label>
            <Input id="price" type="number" step="1" {...register('price')} className="mt-1" />
            {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" {...register('tags')} className="mt-1" placeholder="e.g., nextjs, tailwind, dashboard" />
          {errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}
        </div>

        <div>
          <Label htmlFor="techStack">Tech Stack (comma-separated, Optional)</Label>
          <Input id="techStack" {...register('techStack')} className="mt-1" placeholder="e.g., React, Node.js, MongoDB" />
           {errors.techStack && <p className="text-sm text-destructive mt-1">{errors.techStack.message}</p>}
        </div>
        
        <div>
          <Label>Main Preview Image</Label>
          <CustomDropzone
            onFileChange={onFileChange}
            currentFileName={selectedFileName}
            accept={{ 'image/*': ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.avif'] }} // Standard image types
            maxSize={5 * 1024 * 1024} // 5MB limit
            className="mt-1"
          />
          {/* previewImageUrl is set by parent page after Blob upload */}
          <input type="hidden" {...register('previewImageUrl')} />
           {errors.previewImageUrl && <p className="text-sm text-destructive mt-1">{errors.previewImageUrl.message}</p>}
        </div>

        {currentImageUrl && (
          <div className="mt-3 p-2 border border-border rounded-lg bg-muted/50 max-w-xs">
            <p className="text-xs text-muted-foreground mb-1">Current/New Preview:</p>
            <Image
              src={currentImageUrl}
              alt="Preview image"
              width={200}
              height={120}
              className="rounded-md object-contain max-h-[120px]"
              data-ai-hint="template image preview"
            />
          </div>
        )}
         {!currentImageUrl && !selectedFileName && (
           <div className="mt-3 p-4 border border-dashed border-input rounded-lg bg-muted/30 text-center text-muted-foreground max-w-xs">
              <ImageIcon className="mx-auto h-8 w-8 mb-1" />
              <p className="text-xs">Upload an image or it will default to a placeholder.</p>
           </div>
         )}

        <div>
          <Label htmlFor="dataAiHint">AI Hint for Image (Optional, 1-2 keywords)</Label>
          <Input id="dataAiHint" {...register('dataAiHint')} className="mt-1" placeholder="e.g., dashboard interface" />
          {errors.dataAiHint && <p className="text-sm text-destructive mt-1">{errors.dataAiHint.message}</p>}
        </div>

        <div>
          <Label htmlFor="previewUrl">Live Preview URL (Optional)</Label>
          <Input id="previewUrl" type="url" {...register('previewUrl')} className="mt-1" placeholder="https://example.com/live-demo" />
          {errors.previewUrl && <p className="text-sm text-destructive mt-1">{errors.previewUrl.message}</p>}
        </div>

        <div>
          <Label htmlFor="downloadZipUrl">Download ZIP URL (Optional, defaults to #)</Label>
          <Input id="downloadZipUrl" type="url" {...register('downloadZipUrl')} className="mt-1" placeholder="https://example.com/template.zip or leave blank for #" />
          {errors.downloadZipUrl && <p className="text-sm text-destructive mt-1">{errors.downloadZipUrl.message}</p>}
        </div>

        <div>
          <Label htmlFor="githubUrl">GitHub URL (Optional)</Label>
          <Input id="githubUrl" type="url" {...register('githubUrl')} className="mt-1" placeholder="https://github.com/user/repo" />
          {errors.githubUrl && <p className="text-sm text-destructive mt-1">{errors.githubUrl.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
