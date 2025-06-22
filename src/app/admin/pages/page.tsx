'use client';

import Link from 'next/link';
import { FileText, Edit, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ManagedSitePage {
  id: string; 
  title: string; 
  path: string; 
  status: 'Published' | 'Draft'; 
  type: 'Content-Managed' | 'Static (Code)';
}

const managedSitePages: ManagedSitePage[] = [
  { id: 'public-about', title: 'About Us (Public Page)', path: '/about', status: 'Published', type: 'Content-Managed' },
  { id: 'contact-us', title: 'Contact Us Page', path: '/contact-us', status: 'Published', type: 'Content-Managed' },
  { id: 'privacy-policy', title: 'Privacy Policy', path: '/privacy', status: 'Published', type: 'Content-Managed' },
  { id: 'terms-of-service', title: 'Terms of Service', path: '/terms', status: 'Published', type: 'Content-Managed' },
  { id: 'refund-policy', title: 'Refund Policy', path: '/refund-policy', status: 'Published', type: 'Content-Managed' },
  { id: 'about-rio', title: 'About RIO (Admin Doc)', path: '/about-rio', status: 'Published', type: 'Content-Managed' },
  { id: 'business-model', title: 'Business Model (Admin Doc)', path: '/business-model', status: 'Published', type: 'Content-Managed' },
  { id: 'developer-guide', title: 'Developer Guide (Admin Doc)', path: '/developer-guide', status: 'Published', type: 'Content-Managed' },
];

const staticCodePages: ManagedSitePage[] = [
    { id: 'home', title: 'Homepage', path: '/', status: 'Published', type: 'Static (Code)' },
    { id: 'templates-listing', title: 'Templates Listing (Part of Homepage)', path: '/#templates', status: 'Published', type: 'Static (Code)' },
    { id: 'checkout', title: 'Checkout Page', path: '/checkout', status: 'Published', type: 'Static (Code)' },
    { id: 'login', title: 'Login Page', path: '/auth/login', status: 'Published', type: 'Static (Code)' },
    { id: 'signup', title: 'Signup Page', path: '/auth/signup', status: 'Published', type: 'Static (Code)' },
];


export default function AdminSitePagesPage() {

  const allDisplayPages = [...managedSitePages, ...staticCodePages];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <FileText className="mr-3 h-8 w-8 text-primary" />
            Site Pages Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage key informational pages on your website.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Website Pages</CardTitle>
          <CardDescription>
            List of key pages. &quot;Content-Managed&quot; pages can be edited. &quot;Static (Code)&quot; pages are part of the application&apos;s core structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allDisplayPages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pages configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Path</TableHead>
                  {/* Removed Type column header */}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDisplayPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Link href={page.path} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary hover:underline text-xs font-medium">
                            {page.path} <ExternalLink className="inline-block ml-1 h-3 w-3" />
                        </Link>
                    </TableCell>
                    {/* Removed Type column cell */}
                    <TableCell>
                      <Badge variant={page.status === 'Published' ? 'default' : 'outline'} className={page.status === 'Published' ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30' : ''}>
                        {page.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {page.type === 'Content-Managed' && (
                        <Button variant="ghost" size="icon" asChild title={`Edit ${page.title}`}>
                          <Link href={`/admin/pages/edit/${page.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Page</span>
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
