
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Edit3, ServerCrash, User, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCustomerByName, updateCustomer } from '@/lib/actions/erpnext/customer.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import type { Customer } from '@/lib/types';

const editCustomerFormSchema = z.object({
  email_id: z.string().email('Invalid email address.').optional().or(z.literal('')),
  mobile_no: z.string().optional(),
});

type EditCustomerFormValues = z.infer<typeof editCustomerFormSchema>;

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const { erpSid } = useCombinedAuth();
  const [isPending, startTransition] = useTransition();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerFormSchema),
  });

  useEffect(() => {
    if (customerId && erpSid) {
      setIsLoading(true);
      setError(null);
      getCustomerByName({ sid: erpSid, customerName: customerId })
        .then((result) => {
          if (result.success && result.data) {
            setCustomer(result.data);
            form.reset({
              email_id: result.data.email_id || '',
              mobile_no: result.data.mobile_no || '',
            });
          } else {
            setError(result.error || 'Customer not found.');
          }
        })
        .catch((err) => {
          setError('Failed to load customer data. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [customerId, erpSid, form]);

  const onSubmit: SubmitHandler<EditCustomerFormValues> = (data) => {
    if (!erpSid || !customerId) {
      toast({ title: "Error", description: "Required information is missing.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await updateCustomer({ sid: erpSid, customerId: customerId, customerData: data });
      if (result.success) {
        toast({ title: 'Customer Updated', description: `Customer "${customer?.customer_name}" has been updated.` });
        router.back();
      } else {
        toast({ title: 'Error Updating Customer', description: result.error, variant: 'destructive' });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading customer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Customer</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-2">Customer not found.</h2>
      </div>
    );
  }


  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Edit3 className="mr-3 h-8 w-8 text-primary" />
            Edit Customer
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" type="button" onClick={() => router.back()} className="w-full sm:w-auto group">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>
              Update the customer's contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input id="customer_name" disabled value={customer.customer_name} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Customer name cannot be changed.</p>
            </div>
            <div>
              <Label htmlFor="email_id"><Mail className="inline-block mr-2 h-4 w-4"/>Email</Label>
              <Input id="email_id" {...form.register('email_id')} className="mt-1" />
              {form.formState.errors.email_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.email_id.message}</p>}
            </div>
             <div>
              <Label htmlFor="mobile_no"><Phone className="inline-block mr-2 h-4 w-4"/>Phone / WhatsApp</Label>
              <Input id="mobile_no" {...form.register('mobile_no')} className="mt-1" />
              {form.formState.errors.mobile_no && <p className="text-sm text-destructive mt-1">{form.formState.errors.mobile_no.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
