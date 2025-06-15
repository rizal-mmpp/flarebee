
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileEdit, Construction } from 'lucide-react';

// This is a placeholder page.
// In a real scenario, you'd fetch page data based on pageId and provide an editor.

const sitePages = [ // Same static list for now, just to get a title
  { id: 'home', title: 'Homepage', path: '/' },
  { id: 'templates-listing', title: 'Templates Listing', path: '/#templates' },
  { id: 'privacy', title: 'Privacy Policy', path: '/privacy' },
  { id: 'terms', title: 'Terms of Service', path: '/terms' },
  { id: 'checkout', title: 'Checkout Page', path: '/checkout' },
  { id: 'login', title: 'Login Page', path: '/auth/login' },
  { id: 'signup', title: 'Signup Page', path: '/auth/signup' },
];

export default function EditSitePage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const pageData = sitePages.find(p => p.id === pageId);
  const pageTitle = pageData ? pageData.title : `Page ID: ${pageId}`;


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <FileEdit className="mr-3 h-8 w-8 text-primary" />
          Edit Page: {pageTitle}
        </h1>
        <Button variant="outline" onClick={() => router.push('/admin/pages')} className="w-full sm:w-auto group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Site Pages
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Construction className="mr-2 h-5 w-5 text-amber-500"/> Placeholder Page</CardTitle>
          <CardDescription>
            This is a placeholder for editing site page content. Full CMS functionality is under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
            <Construction className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">
                Content editing for &quot;{pageTitle}&quot; will be available here in a future update.
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
                For static pages like Privacy Policy or Terms of Service, content is typically updated directly in the codebase.
                Dynamic page content management will be introduced later.
            </p>
             <Button variant="default" asChild className="mt-4">
                <Link href="/admin/pages">Return to Page List</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
