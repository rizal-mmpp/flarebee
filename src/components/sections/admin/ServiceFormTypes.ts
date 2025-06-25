
import * as z from 'zod';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '@/lib/constants';

const servicePackageSchema = z.object({
  name: z.string().min(1, "Package name is required."),
  description: z.string().min(1, "Package description is required."),
  priceMonthly: z.coerce.number().min(0, "Monthly price must be a positive number."),
  priceAnnually: z.coerce.number().min(0, "Annual price must be a positive number."),
  features: z.string().min(1, "Features (comma-separated) are required."),
  isPopular: z.boolean().default(false),
  cta: z.string().optional(),
});

const faqItemSchema = z.object({
  id: z.string(),
  q: z.string().min(1, "Question is required."),
  a: z.string().min(1, "Answer is required."),
});

const pricingDetailsSchema = z.object({
  isFixedPriceActive: z.boolean().default(false),
  fixedPriceDetails: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive."),
    imageUrl: z.string().url('Must be a valid URL or empty string.').optional().nullable(),
    imageAiHint: z.string().optional(),
  }).optional(),
  
  isSubscriptionActive: z.boolean().default(false),
  subscriptionDetails: z.object({
    annualDiscountPercentage: z.coerce.number().min(0).max(100).optional(),
    packages: z.array(servicePackageSchema).optional(),
  }).optional(),

  isCustomQuoteActive: z.boolean().default(false),
  customQuoteDetails: z.object({
    title: z.string().optional(),
    text: z.string().optional(),
    infoBoxText: z.string().optional(),
    formTitle: z.string().optional(),
    formDescription: z.string().optional(),
  }).optional(),
}).refine(data => {
    if (data.isFixedPriceActive && (!data.fixedPriceDetails || data.fixedPriceDetails.price < 0)) { // Allow 0
        return false;
    }
    return true;
}, {
    message: "A positive price is required for the active Fixed Price model.",
    path: ["fixedPriceDetails", "price"],
});


export const serviceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  longDescription: z.string().min(20, 'Long description must be at least 20 characters (Markdown supported)'),
  categoryId: z.string().min(1, 'Category is required').refine(val => SERVICE_CATEGORIES.some(cat => cat.id === val), {
    message: "Invalid category selected.",
  }),
  tags: z.string().min(1, 'Tags are required (comma-separated)'),
  imageUrl: z.string().optional(),
  dataAiHint: z.string().optional(),
  status: z.enum(SERVICE_STATUSES, {
    errorMap: () => ({ message: "Please select a valid status." }),
  }),
  keyFeatures: z.string().optional(),
  targetAudience: z.string().optional(),
  estimatedDuration: z.string().optional(),
  portfolioLink: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  
  pricing: pricingDetailsSchema,
  
  showFaqSection: z.boolean().default(false),
  faq: z.array(faqItemSchema).optional(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
