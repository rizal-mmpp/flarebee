
'use client';

import Link from 'next/link';
import { FileText, Eye, Edit, PlusCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface SitePage {
  id: string;
  title: string;
  path: string;
  status: 'Published' | 'Draft';
  type: 'Static' | 'Dynamic (Placeholder)';
}

const sitePages: SitePage[] = [
  { id: 'home', title: 'Homepage', path: '/', status: 'Published', type: 'Static' },
  { id: 'templates-listing', title: 'Templates Listing', path: '/#templates', status: 'Published', type: 'Static' },
  { id: 'privacy', title: 'Privacy Policy', path: '/privacy', status: 'Published', type: 'Static' },
  { id: 'terms', title: 'Terms of Service', path: '/terms', status: 'Published', type: 'Static' },
  { id: 'checkout', title: 'Checkout Page', path: '/checkout', status: 'Published', type: 'Static' },
  { id: 'login', title: 'Login Page', path: '/auth/login', status: 'Published', type: 'Static' },
  { id: 'signup', title: 'Signup Page', path: '/auth/signup', status: 'Published', type: 'Static' },
  // Add more pages as needed
];

export default function AdminSitePagesPage() {
  // Placeholder for future state management if pages become dynamic
  // const [pages, setPages] = useState<SitePage[]>(sitePages);
  // const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <FileText className="mr-3 h-8 w-8 text-primary" />
            Site Pages Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage important pages on your website. (CRUD operations are placeholders for static pages).
          </p>
        </div>
        <Button asChild disabled>
          {/* Placeholder for adding new dynamic pages in the future */}
          <Link href="/admin/pages/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Page (Future)
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Website Pages</CardTitle>
          <CardDescription>A list of key informational and functional pages.</CardDescription>
        </CardHeader>
        <CardContent>
          {sitePages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pages configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Path</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sitePages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Link href={page.path} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary text-xs">
                            {page.path} <ExternalLink className="inline-block ml-1 h-3 w-3" />
                        </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={page.type === 'Static' ? 'secondary' : 'outline'}>{page.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.status === 'Published' ? 'default' : 'outline'} className={page.status === 'Published' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
                        {page.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={page.path} target="_blank" rel="noopener noreferrer" title={`View ${page.title} page`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Page</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild title={`Edit ${page.title} (Placeholder)`}>
                        <Link href={`/admin/pages/edit/${page.id}`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Page</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
            <CardTitle className="text-lg">Note on Page Management</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Currently, this section lists predefined static pages. Full Content Management System (CMS) capabilities for creating, editing, and deleting dynamic page content
                are a feature planned for future development. The &quot;Edit&quot; functionality for these static pages is a placeholder.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
