
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TemplateUploadForm } from '@/components/sections/admin/TemplateUploadForm';
import { getTemplateByIdFromFirestore } from '@/lib/firebase/firestoreTemplates';
import type { Template } from '@/lib/types';
import { Loader2, ServerCrash, Edit3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setError(null);
      getTemplateByIdFromFirestore(id)
        .then((fetchedTemplate) => {
          if (fetchedTemplate) {
            setTemplate(fetchedTemplate);
          } else {
            setError('Template not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch template for editing:', err);
          setError('Failed to load template data. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  const handleFormSuccess = () => {
    router.push('/admin/dashboard'); // Redirect to dashboard after update
  };

  const handleCancelEdit = () => {
    router.push('/admin/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading template for editing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Template</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!template) {
     return ( // Should be caught by error state, but as a fallback
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-6">Template data could not be loaded or template does not exist.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Edit3 className="mr-3 h-8 w-8 text-primary" />
          Edit Template
        </h1>
         <Button variant="outline" asChild className="group" onClick={handleCancelEdit}>
            <Link href="/admin/dashboard"> {/* Link for SSR, onClick for CSR */}
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Back to Dashboard
            </Link>
        </Button>
      </div>
      <TemplateUploadForm
        editingTemplate={template}
        onFormSuccess={handleFormSuccess}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
}
