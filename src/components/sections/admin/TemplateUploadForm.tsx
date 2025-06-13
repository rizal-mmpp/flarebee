
'use client';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import type { TemplateFormValues } from './TemplateFormTypes'; // Assuming you'll create this
import { cn } from '@/lib/utils';

interface TemplateUploadFormProps {
  control: Control<TemplateFormValues>;
  register: UseFormRegister<TemplateFormValues>;
  errors: FieldErrors<TemplateFormValues>;
}

export function TemplateUploadForm({ control, register, errors }: TemplateUploadFormProps) {
  return (
    <Card> {/* Removed shadow-lg */}
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
            <Label htmlFor="price">Price ($)</Label>
            <Input id="price" type="number" step="0.01" {...register('price')} className="mt-1" />
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
          <Label htmlFor="previewImageUrl">Main Preview Image URL</Label>
          <Input id="previewImageUrl" type="url" {...register('previewImageUrl')} className="mt-1" placeholder="https://example.com/main-image.png" />
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
