
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServicesFromErpNext } from '@/lib/actions/erpnext.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { cn } from '@/lib/utils';
import type { Service } from '@/lib/types';

interface ItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hasError?: boolean;
}

export function ItemSelector({ value, onChange, className, hasError = false }: ItemSelectorProps) {
  const { erpSid } = useCombinedAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!erpSid) return;
    setIsLoading(true);
    const result = await getServicesFromErpNext({ sid: erpSid });
    if (result.success && result.data) {
      setItems(result.data);
    } else {
      toast({ title: "Error", description: result.error || "Could not fetch items.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [erpSid, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select onValueChange={onChange} value={value || ''} disabled={isLoading}>
        <SelectTrigger id="item" className={cn(hasError && "border-destructive")}>
          <SelectValue placeholder={isLoading ? "Loading services..." : "Select a service"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            items.map(item => (
              <SelectItem key={item.id} value={item.id}>{item.title} ({item.id})</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
