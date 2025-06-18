
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { SitePage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Loader2, AlertTriangle, Info, Lightbulb, Wrench, FileText } from 'lucide-react';

// Helper to get appropriate icon based on pageId
const getPageIcon = (pageId: string) => {
  if (pageId === 'about-rio') return <Info className="mr-3 h-7 w-7 text-primary" />;
  if (pageId === 'business-model') return <Lightbulb className="mr-3 h-7 w-7 text-primary" />;
  if (pageId === 'developer-guide') return <Wrench className="mr-3 h-7 w-7 text-primary" />;
  return <FileText className="mr-3 h-7 w-7 text-primary" />; // Default
};


export default function ViewAdminDocPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const [pageContent, setPageContent] = useState<SitePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pageId) {
      setIsLoading(true);
      setError(null);
      getSitePageContent(pageId)
        .then((data) => {
          if (data) {
            // If content is the default placeholder, make it clearer in the admin view
            if (data.content.includes("Enter content here.") && !data.content.includes("## Admin Notice")) {
                data.content = `## Admin Notice: Default Content\n\nThis page is using default placeholder content. Please edit it.\n\n---\n\n${data.content}`;
            }
            setPageContent(data);
          } else {
            setError(`Content for page ID "${pageId}" not found. This may be a new page not yet saved.`);
            // Create a default structure for display if not found
            setPageContent({
                id: pageId,
                title: pageId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                content: `# ${pageId.replace(/-/g, ' ')}\n\nContent not yet created for this page. Click "Edit this Page" to add content.`,
                updatedAt: new Date().toISOString()
            });
          }
        })
        .catch((err) => {
          console.error("Error fetching page content:", err);
          setError("Failed to load page content. Please try again.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [pageId]);

  if (!pageId) {
     return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Invalid Page</h2>
        <p className="text-muted-foreground mb-6">No page ID provided.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/docs">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Docs
          </Link>
        </Button>
      </div>
    );
  }

  const pageTitle = isLoading ? "Loading title..." : (pageContent?.title || pageId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
          {getPageIcon(pageId)}
          {pageTitle}
        </h1>
        <div className="flex gap-3 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => router.push('/admin/docs')} className="w-full sm:w-auto group">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Admin Docs Home
          </Button>
          <Button variant="default" onClick={() => router.push(`/admin/pages/edit/${pageId}`)} className="w-full sm:w-auto group bg-primary/80 hover:bg-primary/90">
            <Edit className="mr-2 h-4 w-4" /> Edit this Page
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{isLoading ? "Loading content..." : "Page Content Preview"}</CardTitle>
          <CardDescription>This is how the content, managed via the CMS, will appear. Use Markdown for formatting.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-destructive flex flex-col items-center text-center py-10">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="text-xl font-semibold">Error Loading Content</p>
              <p>{error}</p>
            </div>
          ) : pageContent ? (
            <article className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80">
              <ReactMarkdown>{pageContent.content}</ReactMarkdown>
            </article>
          ) : (
            <p>No content available for this page yet. Click "Edit this Page" to add content.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
