'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListOrdered } from 'lucide-react';

export default function AdminProjectsPage() {
  return (
    <div className="space-y-8">
       <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <ListOrdered className="mr-3 h-8 w-8 text-primary" />
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, track, and deliver client projects.
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/admin/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Project
            </Link>
          </Button>
        </div>
      </header>

       <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>A list of all client projects will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
             <p>Project list data table will be implemented in the next step.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}