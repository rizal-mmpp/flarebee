
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, Package, CalendarDays, User, Tag, Hash, CreditCard, ExternalLink, Settings, Briefcase, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { getProjectByName, createAndSendInvoice } from '@/lib/actions/erpnext/project.actions';
import type { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


const getStatusBadgeVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'in progress':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'awaiting payment':
    case 'awaiting delivery':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
    case 'open':
    case 'draft':
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};


const InfoRow = ({ label, value, icon: Icon, children }: { label: string, value?: React.ReactNode, icon?: React.ElementType, children?: React.ReactNode }) => (
    <div className="space-y-1">
        <h4 className="font-semibold text-muted-foreground flex items-center text-xs uppercase tracking-wider">
            {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80" />}
            {label}
        </h4>
        <div className="text-foreground text-sm font-medium">{value}</div>
        {children}
    </div>
);


export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;
  const { erpSid } = useCombinedAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingInvoice, startInvoiceTransition] = useTransition();

  const fetchProject = async () => {
    if (!projectId || !erpSid) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getProjectByName({ sid: erpSid, projectName: projectId });
      if (result.success && result.data) {
        setProject(result.data);
      } else {
        setError(result.error || 'Project not found.');
      }
    } catch (err) {
      console.error('Failed to fetch project details:', err);
      setError('Failed to load project details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (projectId && erpSid) {
      fetchProject();
    } else if (!erpSid) {
        setError('Not authenticated with ERPNext.');
        setIsLoading(false);
    }
  }, [projectId, erpSid]);

  const handleCreateInvoice = () => {
    if (!project || !erpSid) return;
    
    startInvoiceTransition(async () => {
      const result = await createAndSendInvoice({ sid: erpSid, projectName: project.name });
      if (result.success) {
        toast({
          title: 'Invoice Created & Sent',
          description: `Invoice ${result.invoiceName} has been created and an email has been sent.`,
        });
        await fetchProject(); // Re-fetch project to update its status and invoice link
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create and send invoice.',
          variant: 'destructive',
        });
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading project details...</p>
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!project) {
     return (
       <div className="container mx-auto px-4 py-12 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested project could not be found.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  const canCreateInvoice = project.status === 'Draft' && !project.sales_invoice;

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
                {project.project_name}
            </h1>
             <p className="text-sm text-muted-foreground">
                Project ID: <span className="font-mono text-foreground/80">{project.name}</span>
            </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/projects')} className="w-full sm:w-auto group">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="text-xl">Project Summary</CardTitle>
           <CardDescription>
            Created on {format(new Date(project.creation), "PPp")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoRow label="Status" icon={Tag} value={<Badge variant="outline" className={cn("capitalize text-sm", getStatusBadgeVariant(project.status || 'open'))}>{project.status || 'Open'}</Badge>} />
            <InfoRow label="Customer" icon={User} value={project.customer} />
            <InfoRow label="Service Item" icon={Briefcase} value={project.service_item} />
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invoicing & Delivery</CardTitle>
          <CardDescription>Manage the billing and delivery process for this project.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoRow label="Sales Invoice" icon={CreditCard}>
               {project.sales_invoice ? (
                  <Button variant="link" asChild className="p-0 h-auto font-medium">
                      <Link href={`/admin/orders/${project.sales_invoice}`} target="_blank" rel="noopener noreferrer">
                         {project.sales_invoice} <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Link>
                  </Button>
              ) : (
                <p className="text-sm text-muted-foreground italic">No invoice created yet.</p>
              )}
            </InfoRow>

             <InfoRow label="Service Management URL" icon={Settings} value={project.service_management_url || <span className="text-sm text-muted-foreground italic">Not set</span>} />
             <InfoRow label="Final Service URL" icon={ExternalLink} value={project.final_service_url || <span className="text-sm text-muted-foreground italic">Not set</span>} />
             <InfoRow label="Delivery Date" icon={CalendarDays} value={project.delivery_date ? format(new Date(project.delivery_date), "PPp") : <span className="text-sm text-muted-foreground italic">Not delivered</span>} />
        </CardContent>
         <CardFooter className="flex items-center gap-4 bg-muted/50 p-4 rounded-b-xl">
          <Button onClick={handleCreateInvoice} disabled={!canCreateInvoice || isCreatingInvoice} className="bg-primary/90 text-primary-foreground hover:bg-primary">
            {isCreatingInvoice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Create & Send Invoice
          </Button>
           {!canCreateInvoice && (
            <p className="text-xs text-muted-foreground">
              {project.sales_invoice 
                ? "An invoice already exists for this project." 
                : 'Project must be in "Draft" status to create an invoice.'}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
