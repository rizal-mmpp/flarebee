
'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type SubscriptionPlanFormValues } from './SubscriptionPlanFormTypes';
import { ItemSelector } from './ItemSelector';

interface SubscriptionPlanFormProps {
  form: any; // React Hook Form's form object
  isEditMode: boolean;
}

const billingIntervals = ['Day', 'Week', 'Month', 'Year'];

export function SubscriptionPlanForm({ form, isEditMode }: SubscriptionPlanFormProps) {
  const { register, control, formState: { errors } } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Details</CardTitle>
        <CardDescription>
          Define the core details of the subscription plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="plan_name">Plan Name</Label>
          <Input id="plan_name" {...register('plan_name')} className="mt-1" placeholder="e.g., Pro Plan, Basic Monthly" />
          {errors.plan_name && <p className="text-sm text-destructive mt-1">{errors.plan_name.message}</p>}
        </div>

        <div>
          <Label htmlFor="item">Service (Item)</Label>
          <Controller
            name="item"
            control={control}
            render={({ field }) => (
              <ItemSelector
                value={field.value}
                onChange={field.onChange}
                className="mt-1"
                hasError={!!errors.item}
              />
            )}
          />
          {errors.item && <p className="text-sm text-destructive mt-1">{errors.item.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="cost">Price (per cycle)</Label>
            <Input id="cost" {...register('cost', { valueAsNumber: true })} type="number" className="mt-1" placeholder="e.g., 150000" />
            {errors.cost && <p className="text-sm text-destructive mt-1">{errors.cost.message}</p>}
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="currency" className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR</SelectItem>
                    {/* Add other currencies if needed */}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && <p className="text-sm text-destructive mt-1">{errors.currency.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="billing_interval">Billing Interval</Label>
            <Controller
              name="billing_interval"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="billing_interval" className="mt-1">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    {billingIntervals.map(interval => (
                      <SelectItem key={interval} value={interval}>{interval}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.billing_interval && <p className="text-sm text-destructive mt-1">{errors.billing_interval.message}</p>}
          </div>
          <div>
            <Label htmlFor="billing_interval_count">Interval Count</Label>
            <Input id="billing_interval_count" {...register('billing_interval_count', { valueAsNumber: true })} type="number" className="mt-1" placeholder="e.g., 1" />
            <p className="text-xs text-muted-foreground mt-1">e.g., 3 Months, 1 Year</p>
            {errors.billing_interval_count && <p className="text-sm text-destructive mt-1">{errors.billing_interval_count.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
