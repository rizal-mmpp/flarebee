
'use client';

import { TemplateUploadForm } from '@/components/sections/admin/TemplateUploadForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CreateTemplatePage() {
  const router = useRouter();

  const handleFormSuccess = () => {
    router.push('/admin/dashboard'); // Redirect to dashboard after creation
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <PlusCircle className="mr-3 h-8 w-8 text-primary" />
          Create New Template
        </h1>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <TemplateUploadForm onFormSuccess={handleFormSuccess} />
    </div>
  );
}
