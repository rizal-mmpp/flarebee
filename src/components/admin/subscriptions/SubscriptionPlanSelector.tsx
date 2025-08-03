
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSubscriptionPlansFromErpNext } from '@/lib/actions/erpnext/subscription-plan.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/types';

interface SubscriptionPlanSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hasError?: boolean;
}

export function SubscriptionPlanSelector({ value, onChange, className, hasError = false }: SubscriptionPlanSelectorProps) {
  const { erpSid } = useCombinedAuth();
  const { toast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!erpSid) return;
    setIsLoading(true);
    const result = await getSubscriptionPlansFromErpNext({ sid: erpSid });
    if (result.success && result.data) {
      setPlans(result.data);
    } else {
      toast({ title: "Error", description: result.error || "Could not fetch subscription plans.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [erpSid, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select onValueChange={onChange} value={value || ''} disabled={isLoading}>
        <SelectTrigger id="subscription_plan" className={cn(hasError && "border-destructive")}>
          <SelectValue placeholder={isLoading ? "Loading plans..." : "Select a plan"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            plans.map(plan => (
              <SelectItem key={plan.name} value={plan.name}>{plan.plan_name}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
