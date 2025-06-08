
'use client';

import { useEffect, useTransition } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import type { Template } from '@/lib/types';
import { Loader2, UploadCloud, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveTemplateAction, updateTemplateAction } from '@/lib/actions/template.actions';
import { cn } from '@/lib/utils';

const templateFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  longDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').refine(val => CATEGORIES.some(cat => cat.id === val), {
    message: "Invalid category selected. Please choose a valid one.",
  }),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  tags: z.string().min(1, 'Tags are required (comma-separated)'),
  techStack: z.string().optional(), // Comma-separated
  previewImageUrl: z.string().url('Must be a valid URL for main image').or(z.literal('')).optional(),
  dataAiHint: z.string().optional(),
  previewUrl: z.string().url('Must be a valid URL for live preview').or(z.literal('')).optional(),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateUploadFormProps {
  editingTemplate?: Template | null;
  onFormSuccess: () => void; // Callback after successful submission
  onCancelEdit?: () => void;
}

export function TemplateUploadForm({ editingTemplate, onFormSuccess, onCancelEdit }: TemplateUploadFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const isEditMode = !!editingTemplate;

  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      categoryId: '',
      price: 0,
      tags: '',
      techStack: '',
      previewImageUrl: '',
      dataAiHint: '',
      previewUrl: '',
    }
  });

  useEffect(() => {
    if (isEditMode && editingTemplate) {
      setValue('title', editingTemplate.title);
      setValue('description', editingTemplate.description);
      setValue('longDescription', editingTemplate.longDescription || '');
      // Ensure categoryId is valid, otherwise, form will show "invalid" due to refined Zod schema
      const isValidCategory = CATEGORIES.some(cat => cat.id === editingTemplate.category.id);
      setValue('categoryId', isValidCategory ? editingTemplate.category.id : ''); 
      setValue('price', editingTemplate.price);
      setValue('tags', editingTemplate.tags.join(', '));
      setValue('techStack', editingTemplate.techStack?.join(', ') || '');
      setValue('previewImageUrl', editingTemplate.imageUrl);
      setValue('dataAiHint', editingTemplate.dataAiHint || '');
      setValue('previewUrl', editingTemplate.previewUrl || '');
    } else {
      reset(); // Reset to default values if not in edit mode or editingTemplate is null
    }
  }, [editingTemplate, isEditMode, setValue, reset]);

  const onSubmit: SubmitHandler<TemplateFormValues> = (data) => {
    startTransition(async () => {
      const formData = new FormData();
      // Convert form data (which might have undefined for optional fields) to FormData
      (Object.keys(data) as Array<keyof TemplateFormValues>).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      let result;
      if (isEditMode && editingTemplate) {
        result = await updateTemplateAction(editingTemplate.id, formData);
      } else {
        result = await saveTemplateAction(formData);
      }

      if (result.error) {
         toast({
          title: `Error ${isEditMode ? 'Updating' : 'Saving'} Template`,
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: `Template ${isEditMode ? 'Updated' : 'Saved'}`,
          description: result.message || `Template action successful.`,
        });
        onFormSuccess(); // Notify parent about success
        if (!isEditMode) reset(); // Reset form only if it was a new creation
      }
    });
  };

  return (
    <Card className="shadow-lg sticky top-24"> {/* Added sticky top for better UX on scroll */}
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          {isEditMode ? <Edit3 className="mr-2 h-6 w-6 text-primary" /> : <UploadCloud className="mr-2 h-6 w-6 text-primary" />}
          {isEditMode ? 'Edit Template' : 'Add New Template'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? `Editing: ${editingTemplate?.title}` : 'Fill in the details to upload a new template.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? 'Update Template' : 'Add Template'}
          </Button>
          {isEditMode && onCancelEdit && (
            <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full mt-2" disabled={isPending}>
              Cancel Edit
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

    