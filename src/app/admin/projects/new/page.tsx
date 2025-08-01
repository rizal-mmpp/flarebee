
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Loader2, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ItemSelector } from '@/components/admin/subscriptions/ItemSelector'; // Re-using for service selection
import { CustomerSelector } from '@/components/admin/projects/CustomerSelector';
import { createProject } from '@/lib/actions/erpnext/project.actions';

export const projectFormSchema = z.object({
  customer: z.string().min(1, 'Customer is required.'),
  service_item: z.string().min(1, 'Service Item is required.'),
  project_name: z.string().min(3, 'Project name must be at least 3 characters.'),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;


export default function CreateProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { erpSid } = useCombinedAuth();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customer: '',
      service_item: '',
      project_name: '',
    }
  });

  const onSubmit: SubmitHandler<ProjectFormValues> = (data) => {
    if (!erpSid) {
      toast({ title: "Authentication Error", description: "Not logged in to ERPNext.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await createProject({ sid: erpSid, projectData: data });

      if (result.success) {
        toast({
          title: 'Project Created',
          description: `Project "${data.project_name}" has been successfully created as a draft.`,
        });
        router.push('/admin/projects'); 
        form.reset();
      } else {
        toast({
          title: 'Error Creating Project',
          description: result.error || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <PackagePlus className="mr-3 h-8 w-8 text-primary" />
            Create New Project
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto group">
              <Link href="/admin/projects"> 
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Create Project
            </Button>
          </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Select the customer and the primary service for this new project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <Label htmlFor="customer">Customer</Label>
                     <Controller
                        name="customer"
                        control={form.control}
                        render={({ field }) => (
                        <CustomerSelector
                            value={field.value}
                            onChange={field.onChange}
                            className="mt-1"
                            hasError={!!form.formState.errors.customer}
                        />
                        )}
                    />
                    {form.formState.errors.customer && <p className="text-sm text-destructive mt-1">{form.formState.errors.customer.message}</p>}
                </div>
                <div>
                    <Label htmlFor="service_item">Service Item</Label>
                    <Controller
                        name="service_item"
                        control={form.control}
                        render={({ field }) => (
                        <ItemSelector
                            value={field.value}
                            onChange={field.onChange}
                            className="mt-1"
                            hasError={!!form.formState.errors.service_item}
                        />
                        )}
                    />
                    {form.formState.errors.service_item && <p className="text-sm text-destructive mt-1">{form.formState.errors.service_item.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="project_name">Project Name</Label>
                    <Input id="project_name" {...form.register('project_name')} className="mt-1" placeholder="e.g., Web Development for PT Abadi Jaya" />
                    {form.formState.errors.project_name && <p className="text-sm text-destructive mt-1">{form.formState.errors.project_name.message}</p>}
                </div>
            </CardContent>
             <CardFooter className="justify-end">
                 <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Create Project
                </Button>
            </CardFooter>
        </Card>
      </div>
    </form>
  );
}
