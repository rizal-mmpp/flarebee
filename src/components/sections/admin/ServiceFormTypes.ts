
import * as z from 'zod';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '@/lib/constants';

// Simplified schema, as complex pricing is now handled in ERPNext
export const serviceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  longDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').refine(val => SERVICE_CATEGORIES.some(cat => cat.id === val), {
    message: "Invalid category selected.",
  }),
  tags: z.string().min(1, 'Tags are required (comma-separated)'),
  imageUrl: z.string().optional(),
  dataAiHint: z.string().optional(),
  status: z.enum(SERVICE_STATUSES, {
    errorMap: () => ({ message: "Please select a valid status." }),
  }),
  serviceUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  
  // Pricing is simplified to just a standard rate on the item
  pricing: z.object({
    fixedPriceDetails: z.object({
        price: z.coerce.number().min(0, "Price must be a positive number.").optional(),
    }).optional(),
  }).optional(),

});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
