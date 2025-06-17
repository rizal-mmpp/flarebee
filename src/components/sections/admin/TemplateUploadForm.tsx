
'use client';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import type { TemplateFormValues } from './TemplateFormTypes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ImageIcon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateUploadFormProps {
  control: Control<TemplateFormValues>;
  register: UseFormRegister<TemplateFormValues>;
  errors: FieldErrors<TemplateFormValues>;
  currentImageUrl?: string | null; // For displaying existing or newly selected image preview
  onFileChange: (file: File | null) => void;
  selectedFileName?: string | null;
}

export function TemplateUploadForm({
  control,
  register,
  errors,
  currentImageUrl,
  onFileChange,
  selectedFileName,
}: TemplateUploadFormProps) {
  
  const handleFileClear = () => {
    const fileInput = document.getElementById('previewImageFile') as HTMLInputElement | null;
    if (fileInput) {
        fileInput.value = ''; // Clear the file input
    }
    onFileChange(null); // Notify parent
  };

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
            <Label htmlFor="price">Price (IDR)</Label> {/* Changed label from $ to IDR */}
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
        </div>
        
        <div>
          <Label htmlFor="previewImageFile">Main Preview Image</Label>
          <Input 
            id="previewImageFile" 
            type="file" 
            accept="image/png, image/jpeg, image/gif, image/webp, image/avif"
            onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)} 
            className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          {selectedFileName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Selected: {selectedFileName}</span>
              <Button variant="ghost" size="icon" type="button" onClick={handleFileClear} className="h-6 w-6 text-destructive hover:text-destructive/80">
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Clear selected file</span>
              </Button>
            </div>
          )}
          {currentImageUrl && (
            <div className="mt-3 p-2 border border-border rounded-md bg-muted/50 max-w-xs">
              <p className="text-xs text-muted-foreground mb-1">Current/New Preview:</p>
              <Image 
                src={currentImageUrl} 
                alt="Preview image" 
                width={200} 
                height={120} // Adjusted height for better aspect ratio if 600x400 is common
                className="rounded-md object-contain max-h-[120px]"
                data-ai-hint="template image preview"
              />
            </div>
          )}
           {!currentImageUrl && !selectedFileName && (
             <div className="mt-3 p-4 border border-dashed rounded-md bg-muted/30 text-center text-muted-foreground max-w-xs">
                <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                <p className="text-xs">No image selected or uploaded yet.</p>
            </div>
           )}
          {/* Hidden input to carry the previewImageUrl for react-hook-form if needed, though now managed by parent state */}
          <input type="hidden" {...register('previewImageUrl')} />
           {errors.previewImageUrl && <p className="text-sm text-destructive mt-1">{errors.previewImageUrl.message}</p>}
        </div>


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
          <Label htmlFor="downloadZipUrl">Download ZIP URL</Label>
          <Input id="downloadZipUrl" type="url" {...register('downloadZipUrl')} className="mt-1" placeholder="https://example.com/template.zip or #" />
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
