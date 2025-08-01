'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUsersFromErpNext } from '@/lib/actions/erpnext/user.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';

interface CustomerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hasError?: boolean;
}

export function CustomerSelector({ value, onChange, className, hasError = false }: CustomerSelectorProps) {
  const { erpSid } = useCombinedAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    if (!erpSid) return;
    setIsLoading(true);
    const result = await getUsersFromErpNext({ sid: erpSid });
    if (result.success && result.data) {
      setCustomers(result.data);
    } else {
      toast({ title: "Error", description: result.error || "Could not fetch customers.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [erpSid, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select onValueChange={onChange} value={value || ''} disabled={isLoading}>
        <SelectTrigger id="customer" className={cn(hasError && "border-destructive")}>
          <SelectValue placeholder={isLoading ? "Loading customers..." : "Select a customer"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            customers.map(customer => (
              <SelectItem key={customer.uid} value={customer.uid}>
                {customer.displayName} ({customer.email})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}