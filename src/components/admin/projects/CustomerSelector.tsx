
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUsersFromErpNext } from '@/lib/actions/erpnext/user.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';
import { NewCustomerDialog } from './NewCustomerDialog';

interface CustomerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCustomerCreated: (newCustomerName: string) => void;
  className?: string;
  hasError?: boolean;
}

export function CustomerSelector({ value, onChange, onCustomerCreated, className, hasError = false }: CustomerSelectorProps) {
  const { erpSid } = useCombinedAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
  
  const handleCreationSuccess = (newCustomerName: string) => {
    fetchCustomers().then(() => {
        onCustomerCreated(newCustomerName);
    });
  };

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
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="flex-shrink-0"
        onClick={() => setIsCreateDialogOpen(true)}
        aria-label="Create new customer"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>

      <NewCustomerDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreationSuccess}
      />
    </div>
  );
}
