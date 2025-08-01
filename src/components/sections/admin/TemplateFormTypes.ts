
import * as z from 'zod';
import { CATEGORIES } from '@/lib/constants';

export const templateFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  longDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').refine(val => CATEGORIES.some(cat => cat.id === val), {
    message: "Invalid category selected. Please choose a valid one.",
  }),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  tags: z.string().min(1, 'Tags are required (comma-separated)'),
  techStack: z.string().optional(), // Comma-separated
  previewImageUrl: z.string().optional(), // This will store the URL from Vercel Blob or an existing URL
  dataAiHint: z.string().optional(),
  previewUrl: z.string().url('Must be a valid URL for live preview').or(z.literal('')).optional(),
  downloadZipUrl: z.string().url('Must be a valid URL for ZIP download').or(z.literal('#')).or(z.literal('')).optional().default('#'),
  githubUrl: z.string().url('Must be a valid GitHub URL').or(z.literal('')).optional(),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
