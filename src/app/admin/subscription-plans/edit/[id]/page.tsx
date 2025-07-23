
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubscriptionPlanForm } from '@/components/admin/subscriptions/SubscriptionPlanForm';
import { type SubscriptionPlanFormValues, subscriptionPlanFormSchema } from '@/components/admin/subscriptions/SubscriptionPlanFormTypes';
import { getSubscriptionPlanByName, updateSubscriptionPlanInErpNext } from '@/lib/actions/erpnext.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, Edit3, ServerCrash } from 'lucide-react';
import Link from 'next/link';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import type { SubscriptionPlan } from '@/lib/types';

export default function EditSubscriptionPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planName = params.id as string;
  const { toast } = useToast();
  const { erpSid } = useCombinedAuth();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanFormSchema),
  });

  useEffect(() => {
    if (planName && erpSid) {
      setIsLoading(true);
      setError(null);
      getSubscriptionPlanByName({ sid: erpSid, planName })
        .then((result) => {
          if (result.success && result.data) {
            form.reset({
              plan_name: result.data.plan_name,
              item: result.data.item,
              billing_interval: result.data.billing_interval,
              billing_interval_count: result.data.billing_interval_count,
              cost: result.data.cost,
              currency: result.data.currency,
            });
          } else {
            setError(result.error || 'Subscription plan not found.');
          }
        })
        .catch((err) => {
          setError('Failed to load plan data. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [planName, erpSid, form]);

  const onSubmit: SubmitHandler<SubscriptionPlanFormValues> = (data) => {
    if (!erpSid) {
      toast({ title: "Authentication Error", description: "Not logged in to ERPNext.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await updateSubscriptionPlanInErpNext({ sid: erpSid, planName: planName, planData: data });
      if (result.success) {
        toast({ title: 'Plan Updated', description: `Subscription plan "${data.plan_name}" has been updated.` });
        router.push('/admin/subscription-plans');
      } else {
        toast({ title: 'Error Updating Plan', description: result.error, variant: 'destructive' });
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Plan</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/subscription-plans">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Edit3 className="mr-3 h-8 w-8 text-primary" />
            Edit Subscription Plan
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto group">
              <Link href="/admin/subscription-plans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plans
              </Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
        <SubscriptionPlanForm form={form} isEditMode={true} />
      </div>
    </form>
  );
}
