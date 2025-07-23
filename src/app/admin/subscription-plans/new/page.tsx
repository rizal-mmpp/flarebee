
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubscriptionPlanForm } from '@/components/admin/subscriptions/SubscriptionPlanForm';
import { type SubscriptionPlanFormValues, subscriptionPlanFormSchema } from '@/components/admin/subscriptions/SubscriptionPlanFormTypes';
import { createSubscriptionPlanInErpNext } from '@/lib/actions/erpnext/subscription-plan.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

export default function CreateSubscriptionPlanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { erpSid } = useCombinedAuth();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanFormSchema),
    defaultValues: {
      plan_name: '',
      item: '',
      billing_interval: 'Month',
      billing_interval_count: 1,
      cost: 0,
      currency: 'IDR',
    }
  });

  const onSubmit: SubmitHandler<SubscriptionPlanFormValues> = (data) => {
    if (!erpSid) {
      toast({ title: "Authentication Error", description: "Not logged in to ERPNext.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await createSubscriptionPlanInErpNext({ sid: erpSid, planData: data });
      if (result.success) {
        toast({ title: 'Plan Created', description: `Subscription plan "${data.plan_name}" has been created.` });
        router.push('/admin/subscription-plans');
      } else {
        toast({ title: 'Error Creating Plan', description: result.error, variant: 'destructive' });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Create New Subscription Plan
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto group">
              <Link href="/admin/subscription-plans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plans
              </Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Create Plan
            </Button>
          </div>
        </div>
        <SubscriptionPlanForm form={form} isEditMode={false} />
      </div>
    </form>
  );
}
