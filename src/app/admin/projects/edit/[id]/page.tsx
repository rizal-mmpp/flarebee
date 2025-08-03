
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Edit3, ServerCrash, User, Mail, Phone, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProjectByName, updateProject } from '@/lib/actions/erpnext/project.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { getCustomerByName, getContactForCustomer } from '@/lib/actions/erpnext/customer.actions';
import type { Project, Customer } from '@/lib/types';


const editProjectFormSchema = z.object({
  project_name: z.string().min(3, 'Project name must be at least 3 characters.'),
  email_id: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile_no: z.string().optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectFormSchema>;

const InfoRow = ({ label, value, icon: Icon }: { label: string, value?: React.ReactNode, icon?: React.ElementType }) => (
    <div className="space-y-1">
        <h4 className="font-semibold text-muted-foreground flex items-center text-xs uppercase tracking-wider">
            {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80" />}
            {label}
        </h4>
        <div className="text-foreground text-sm font-medium">{value || <span className="italic">Not set</span>}</div>
    </div>
);


export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectName = params.id as string;
  const { toast } = useToast();
  const { erpSid } = useCombinedAuth();
  const [isPending, startTransition] = useTransition();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);

  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectFormSchema),
  });

  useEffect(() => {
    if (projectName && erpSid) {
      setIsLoading(true);
      setError(null);
      getProjectByName({ sid: erpSid, projectName })
        .then(async (result) => {
          if (result.success && result.data) {
            const fetchedProject = result.data;
            setProject(fetchedProject);
            
            const customerResult = await getCustomerByName({ sid: erpSid, customerName: fetchedProject.customer });
            if (customerResult.success && customerResult.data) {
              setCustomer(customerResult.data);

              // Fetch the associated contact to get the editable fields
              const contactResult = await getContactForCustomer({ sid: erpSid, customerName: fetchedProject.customer });
              if(contactResult.success && contactResult.data) {
                setContactId(contactResult.data.name);
                form.reset({
                  project_name: fetchedProject.project_name,
                  email_id: contactResult.data.email_id || '',
                  mobile_no: contactResult.data.mobile_no || '',
                });
              } else {
                 form.reset({ project_name: fetchedProject.project_name, email_id: '', mobile_no: '' });
                 console.warn("Could not find a linked contact for this customer.");
              }

            } else {
               setError('Could not load associated customer data.');
            }
          } else {
            setError(result.error || 'Project not found.');
          }
        })
        .catch((err) => {
          setError('Failed to load project data. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [projectName, erpSid, form]);

  const onSubmit: SubmitHandler<EditProjectFormValues> = (data) => {
    if (!erpSid) {
      toast({ title: "Authentication Error", description: "Not logged in to ERPNext.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      
      const projectDataToUpdate = { project_name: data.project_name };
      
      let contactDataPayload;
      if (contactId) {
        contactDataPayload = {
          contactId: contactId,
          data: {
            email_id: data.email_id,
            mobile_no: data.mobile_no,
          }
        }
      }

      const result = await updateProject({
        sid: erpSid,
        projectName: projectName,
        projectData: projectDataToUpdate,
        contactData: contactDataPayload,
      });

      if (result.success) {
        toast({ title: 'Project Updated', description: `Project "${data.project_name}" has been updated.` });
        router.push(`/admin/projects/${projectName}`);
      } else {
        toast({ title: 'Error Updating Project', description: result.error, variant: 'destructive' });
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Project</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
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
            Edit Project
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto group" type="button">
              <Link href={`/admin/projects/${projectName}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                    Update the project's name and customer contact info.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                    <Label htmlFor="project_name">Project Name *</Label>
                    <Input id="project_name" {...form.register('project_name')} className="mt-1" />
                    {form.formState.errors.project_name && <p className="text-sm text-destructive mt-1">{form.formState.errors.project_name.message}</p>}
                    </div>
                    <div>
                        <Label>Customer</Label>
                        <Input className="mt-1 bg-muted/70" disabled value={project?.customer || 'N/A'} />
                        <p className="text-xs text-muted-foreground mt-1">Customer cannot be changed after project creation.</p>
                    </div>
                    <div>
                        <Label>Service Item</Label>
                        <Input className="mt-1 bg-muted/70" disabled value={project?.service_item || 'N/A'} />
                        <p className="text-xs text-muted-foreground mt-1">Service Item cannot be changed after project creation.</p>
                    </div>
                </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Update the primary contact details for this customer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="email_id">Contact Email</Label>
                            <Input id="email_id" {...form.register('email_id')} className="mt-1" />
                            {form.formState.errors.email_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.email_id.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="mobile_no">Contact Phone / WhatsApp</Label>
                            <Input id="mobile_no" {...form.register('mobile_no')} className="mt-1" />
                            {form.formState.errors.mobile_no && <p className="text-sm text-destructive mt-1">{form.formState.errors.mobile_no.message}</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
             <div className="lg:col-span-1">
                <Card className="sticky top-24">
                    <CardHeader>
                        <CardTitle className="text-xl">Customer Details</CardTitle>
                        <CardDescription>Read-only customer information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customer ? (
                            <>
                                <InfoRow label="Name" icon={User} value={customer.customer_name} />
                                <InfoRow label="Type" icon={Building} value={customer.customer_type} />
                                <InfoRow label="Email (Original)" icon={Mail} value={customer.email_id} />
                                <InfoRow label="Phone (Original)" icon={Phone} value={customer.mobile_no} />
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Customer info not available.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>

      </div>
    </form>
  );
}
