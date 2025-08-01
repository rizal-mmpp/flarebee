
'use client';

import React, { useState, useTransition } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { createCustomerInErpNext } from '@/lib/actions/erpnext/customer.actions';

interface NewCustomerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (newCustomerName: string) => void;
}

const newCustomerSchema = z.object({
  customer_name: z.string().min(1, 'Customer Name is required.'),
  customer_type: z.enum(['Company', 'Individual'], {
    errorMap: () => ({ message: 'Please select a customer type.' }),
  }),
  email_id: z.string().email('Invalid email address.').optional().or(z.literal('')),
});
type NewCustomerFormValues = z.infer<typeof newCustomerSchema>;

export function NewCustomerDialog({ isOpen, onOpenChange, onSuccess }: NewCustomerDialogProps) {
  const { erpSid } = useCombinedAuth();
  const { toast } = useToast();
  const [isCreating, startCreateTransition] = useTransition();

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: { customer_type: 'Company', email_id: '' },
  });

  const handleCreateCustomer: SubmitHandler<NewCustomerFormValues> = async (data) => {
    if (!erpSid) return;
    
    startCreateTransition(async () => {
      const result = await createCustomerInErpNext({ sid: erpSid, customerData: data });
      if (result.success && result.name) {
        toast({ title: 'Customer Created', description: `Customer "${data.customer_name}" has been added.` });
        onSuccess(result.name);
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to create customer.', variant: 'destructive' });
      }
    });
  };

  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(handleCreateCustomer)}>
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer record in ERPNext.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input id="customer_name" {...register('customer_name')} className="mt-1" />
              {errors.customer_name && <p className="text-sm text-destructive mt-1">{errors.customer_name.message}</p>}
            </div>
             <div>
              <Label htmlFor="customer_type">Customer Type *</Label>
               <Controller
                  name="customer_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="customer_type" className="mt-1">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Individual">Individual</SelectItem>
                        </SelectContent>
                    </Select>
                  )}
                />
              {errors.customer_type && <p className="text-sm text-destructive mt-1">{errors.customer_type.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email Id</Label>
              <Input id="email" type="email" {...register('email_id')} className="mt-1" placeholder="e.g., contact@company.com" />
              {errors.email_id && <p className="text-sm text-destructive mt-1">{errors.email_id.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
