
'use client';
import { useState } from 'react';
import { TemplateUploadForm } from '@/components/sections/admin/TemplateUploadForm';
import { AdminTemplateList } from '@/components/sections/admin/AdminTemplateList';
import { MOCK_TEMPLATES } from '@/lib/constants';
import type { Template } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { BarChart3, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const { toast } = useToast();

  const handleTemplateAdd = (newTemplate: Template) => {
    setTemplates(prevTemplates => [newTemplate, ...prevTemplates]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    toast({
      title: "Template Deleted",
      description: `Template with ID ${templateId} has been removed from the list. (UI only)`,
    });
  };

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <LayoutGrid className="mr-3 h-8 w-8 text-primary" />
          Flarebee Admin Panel
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your Flarebee templates. Upload new ones, edit existing, and view stats.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6 text-primary" />
          Overview (Placeholder)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Templates</h3>
            <p className="text-3xl font-bold text-foreground">{templates.length}</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Sales</h3>
            <p className="text-3xl font-bold text-foreground">$1,234.56</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Actions</h3>
            <p className="text-3xl font-bold text-foreground">3</p>
          </div>
        </div>
      </section>
      
      <Separator className="my-10" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
           <h2 className="text-2xl font-semibold text-foreground mb-4">Manage Templates</h2>
          <AdminTemplateList templates={templates} onDeleteTemplate={handleDeleteTemplate} />
        </div>
        <div>
          <TemplateUploadForm onTemplateAdd={handleTemplateAdd} />
        </div>
      </div>
    </div>
  );
}
