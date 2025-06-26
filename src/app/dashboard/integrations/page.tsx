
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Puzzle, Wrench } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Puzzle className="mr-3 h-8 w-8 text-primary" />
          Integrations
        </h1>
         <Button variant="outline" asChild className="group">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

       <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
            <Wrench className="h-10 w-10 text-primary" />
          </div>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>This feature is coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="max-w-md mx-auto text-muted-foreground">
            We are working hard to bring you powerful integrations. Please check back later to connect your favorite tools and services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
