
'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminTemplateList } from '@/components/sections/admin/AdminTemplateList';
import { getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import type { Template } from '@/lib/types';
import { LayoutGrid, Loader2, PlusCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteTemplateAction } from '@/lib/actions/template.actions';
import { Button } from '@/components/ui/button';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const fetchedTemplates = await getAllTemplatesFromFirestore();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast({
        title: "Error Fetching Templates",
        description: "Could not load templates from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteTemplate = async (templateId: string) => {
    setIsDeleting(templateId);
    const result = await deleteTemplateAction(templateId);
    if (result.success) {
      toast({
        title: "Template Deleted",
        description: result.message,
      });
      fetchTemplates(); 
    } else {
      toast({
        title: "Error Deleting Template",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsDeleting(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <LayoutGrid className="mr-3 h-8 w-8 text-primary" />
            Manage Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, or remove templates available on your platform.
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
            <Button onClick={fetchTemplates} variant="outline" disabled={isLoadingTemplates || !!isDeleting}>
                {isLoadingTemplates ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                Refresh List
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/admin/templates/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Template
                </Link>
            </Button>
        </div>
      </header>
      
      <section>
           {isLoadingTemplates ? (
             <div className="flex justify-center items-center h-64">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="ml-3 text-muted-foreground">Loading templates...</p>
             </div>
           ) : (
             <AdminTemplateList 
               templates={templates} 
               onDeleteTemplate={handleDeleteTemplate}
               isDeleting={isDeleting}
            />
           )}
      </section>
    </div>
  );
}
