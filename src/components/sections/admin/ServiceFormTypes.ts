
import * as z from 'zod';
import { SERVICE_CATEGORIES, PRICING_MODELS, SERVICE_STATUSES } from '@/lib/constants';

const servicePackageSchema = z.object({
  name: z.string().min(1, "Package name is required."),
  description: z.string().min(1, "Package description is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  features: z.string().min(1, "Features (comma-separated) are required."), // Stored as comma-separated string in form
  isPopular: z.boolean().default(false),
  cta: z.string().optional(),
});

const faqItemSchema = z.object({
  id: z.string(),
  q: z.string().min(1, "Question is required."),
  a: z.string().min(1, "Answer is required."),
});


export const serviceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  longDescription: z.string().min(20, 'Long description must be at least 20 characters (Markdown supported)'),
  categoryId: z.string().min(1, 'Category is required').refine(val => SERVICE_CATEGORIES.some(cat => cat.id === val), {
    message: "Invalid category selected.",
  }),
  pricingModel: z.enum(PRICING_MODELS, {
    errorMap: () => ({ message: "Please select a valid pricing model." }),
  }),
  priceMin: z.coerce.number().optional().nullable(),
  priceMax: z.coerce.number().optional().nullable(),
  currency: z.string().default('IDR'),
  tags: z.string().min(1, 'Tags are required (comma-separated)'),
  imageUrl: z.string().optional(), // Will be populated by Vercel Blob URL or existing
  dataAiHint: z.string().optional(),
  status: z.enum(SERVICE_STATUSES, {
    errorMap: () => ({ message: "Please select a valid status." }),
  }),
  keyFeatures: z.string().optional(), // Comma-separated
  targetAudience: z.string().optional(), // Comma-separated
  estimatedDuration: z.string().optional(),
  portfolioLink: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  
  // New dynamic sections
  showPackagesSection: z.boolean().default(false),
  packages: z.array(servicePackageSchema).optional(),
  showFaqSection: z.boolean().default(false),
  faq: z.array(faqItemSchema).optional(),
  
}).refine(data => {
  if ((data.pricingModel === "Fixed Price" || data.pricingModel === "Starting At") && (data.priceMin === null || data.priceMin === undefined || isNaN(data.priceMin) || data.priceMin <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Price is required and must be positive for this pricing model.",
  path: ["priceMin"],
}).refine(data => {
  if (data.priceMin && data.priceMax && data.priceMin > data.priceMax) {
    return false;
  }
  return true;
}, {
  message: "Price Max cannot be less than Price Min.",
  path: ["priceMax"],
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
