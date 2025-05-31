
'use client';
import { useState, useEffect, useCallback } from 'react';
import { TemplateUploadForm, type TemplateFormValues } from '@/components/sections/admin/TemplateUploadForm';
import { AdminTemplateList } from '@/components/sections/admin/AdminTemplateList';
import { getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import type { Template } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { BarChart3, LayoutGrid, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteTemplateAction } from '@/lib/actions/template.actions';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission state
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // ID of template being deleted

  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleFormSuccess = () => {
    fetchTemplates(); // Re-fetch templates after add/update
    setEditingTemplate(null); // Clear editing state
    setIsSubmitting(false);
     // Scroll to top might be good here or to the list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form for editing
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
  }

  const handleDeleteTemplate = async (templateId: string) => {
    setIsDeleting(templateId);
    const result = await deleteTemplateAction(templateId);
    if (result.success) {
      toast({
        title: "Template Deleted",
        description: result.message,
      });
      fetchTemplates(); // Refresh list
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
    <div>
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <LayoutGrid className="mr-3 h-8 w-8 text-primary" />
          Flarebee Admin Panel
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your Flarebee templates. Add new ones, edit existing, and view site data.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6 text-primary" />
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Templates</h3>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin mt-1" /> : <p className="text-3xl font-bold text-foreground">{templates.length}</p>}
          </div>
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Sales (Placeholder)</h3>
            <p className="text-3xl font-bold text-foreground">$0.00</p>
          </div>
           <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Users (Placeholder)</h3>
            <p className="text-3xl font-bold text-foreground">0</p>
          </div>
        </div>
         <div className="mt-6">
            <Button onClick={fetchTemplates} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Refresh Templates
            </Button>
        </div>
      </section>
      
      <Separator className="my-10" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 order-2 lg:order-1">
           <h2 className="text-2xl font-semibold text-foreground mb-4">Manage Templates</h2>
           {isLoading && templates.length === 0 ? (
             <div className="flex justify-center items-center h-64">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
           ) : (
             <AdminTemplateList 
               templates={templates} 
               onEditTemplate={handleEditTemplate}
               onDeleteTemplate={handleDeleteTemplate}
               isDeleting={isDeleting}
            />
           )}
        </div>
        <div className="lg:col-span-1 order-1 lg:order-2">
          <TemplateUploadForm 
            key={editingTemplate ? editingTemplate.id : 'new'} // Re-render form when editingTemplate changes
            editingTemplate={editingTemplate}
            onFormSuccess={handleFormSuccess}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </div>
    </div>
  );
}
