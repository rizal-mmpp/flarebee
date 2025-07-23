
import * as z from 'zod';

const billingIntervals = ['Day', 'Week', 'Month', 'Year'] as const;

export const subscriptionPlanFormSchema = z.object({
  plan_name: z.string().min(3, 'Plan name must be at least 3 characters.'),
  item: z.string().min(1, 'A service (Item) must be linked to this plan.'),
  cost: z.coerce.number().min(0, "Price must be a positive number."),
  currency: z.string().min(3, 'Currency is required.'),
  billing_interval: z.enum(billingIntervals, {
    errorMap: () => ({ message: "Please select a valid billing interval." }),
  }),
  billing_interval_count: z.coerce.number().int().min(1, "Interval count must be at least 1."),
});

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanFormSchema>;
