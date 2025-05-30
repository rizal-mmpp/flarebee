'use client';

import { useState, useTransition } from 'react';
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
import type { Category, Template } from '@/lib/types';
import { Loader2, Wand2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestTagsAndDescription, saveTemplate } from '@/lib/actions/template.actions';

const templateFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  longDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  tags: z.string().min(1, 'Tags are required (comma-separated)'),
  techStack: z.string().optional(), // Comma-separated
  previewImageUrl: z.string().url('Must be a valid URL').optional(),
  // File inputs would need more complex handling for actual uploads
  // For this UI demo, we'll use text inputs for URLs or skip them
  templateContentForAI: z.string().optional(), // For AI suggestion
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateUploadFormProps {
  onTemplateAdd: (newTemplate: Template) => void;
}

export function TemplateUploadForm({ onTemplateAdd }: TemplateUploadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      price: 0,
      tags: '',
      techStack: '',
    }
  });

  const handleSuggest = () => {
    const content = getValues('templateContentForAI');
    if (!content || content.length < 50) {
      toast({
        title: "Content Too Short",
        description: "Please provide at least 50 characters of template content for AI suggestions.",
        variant: "destructive",
      });
      return;
    }

    startSuggestionTransition(async () => {
      const formData = new FormData();
      formData.append('templateContent', content);
      const result = await suggestTagsAndDescription(formData);

      if (result.error) {
        toast({
          title: "AI Suggestion Failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        setValue('description', result.data.description);
        setValue('tags', result.data.tags.join(', '));
        toast({
          title: "AI Suggestions Applied",
          description: "Description and tags have been populated.",
        });
      }
    });
  };

  const onSubmit: SubmitHandler<TemplateFormValues> = (data) => {
    startTransition(async () => {
      // Simulate form data for server action
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Call server action to save template
      const result = await saveTemplate(formData);

      if (result.error) {
         toast({
          title: "Error Saving Template",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Template Action",
          description: result.message || "Template action simulated.",
        });
        // Mock adding to a list for UI update. In real app, this would come from DB.
        const newTemplate: Template = {
          id: `new-${Date.now()}`,
          title: data.title,
          description: data.description,
          longDescription: data.longDescription,
          category: CATEGORIES.find(c => c.id === data.categoryId) as Category,
          price: data.price,
          tags: data.tags.split(',').map(t => t.trim()),
          techStack: data.techStack?.split(',').map(t => t.trim()),
          imageUrl: data.previewImageUrl || 'https://placehold.co/600x400.png',
          dataAiHint: 'custom template',
          createdAt: new Date().toISOString(),
        };
        onTemplateAdd(newTemplate);
        // Consider resetting the form: reset();
      }
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" /> Add New Template
        </CardTitle>
        <CardDescription>Fill in the details to upload a new template to Flarebee.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} className="mt-1" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="templateContentForAI">Template Content for AI (e.g., README, key features)</Label>
            <Textarea
              id="templateContentForAI"
              {...register('templateContentForAI')}
              rows={5}
              className="mt-1"
              placeholder="Paste relevant content here to help AI generate description and tags..."
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="mt-2 group"
            >
              {isSuggesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110" />
              )}
              Suggest with AI
            </Button>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="categoryId" className="mt-1">
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
            <Label htmlFor="previewImageUrl">Preview Image URL (Optional)</Label>
            <Input id="previewImageUrl" type="url" {...register('previewImageUrl')} className="mt-1" placeholder="https://example.com/image.png" />
             {errors.previewImageUrl && <p className="text-sm text-destructive mt-1">{errors.previewImageUrl.message}</p>}
          </div>

          {/* Actual file inputs are more complex and would require server-side handling for storage.
              For this demo, we might omit them or use URL inputs.
          <div className="space-y-1">
            <Label htmlFor="templateZip">Template ZIP File</Label>
            <Input id="templateZip" type="file" accept=".zip" className="mt-1 file:text-primary file:font-medium"/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="previewImages">Preview Screenshots (multiple)</Label>
            <Input id="previewImages" type="file" accept="image/*" multiple className="mt-1 file:text-primary file:font-medium" />
          </div>
          */}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending || isSuggesting}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add Template
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
