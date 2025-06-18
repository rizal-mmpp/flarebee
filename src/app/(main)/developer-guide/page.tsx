
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Wrench } from 'lucide-react';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { SitePage } from '@/lib/types';

const PAGE_ID = "developer-guide";

export default function DeveloperGuidePage() {
  const [pageContent, setPageContent] = useState<SitePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      setError(null);
      try {
        const content = await getSitePageContent(PAGE_ID);
        if (content) {
          setPageContent(content);
        } else {
          setError(`Content for "${PAGE_ID}" could not be loaded.`);
        }
      } catch (err: any) {
        console.error(`Error fetching content for ${PAGE_ID}:`, err);
        setError(err.message || "Failed to load content.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl flex items-center">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : 
             pageContent?.title ? <><Wrench className="mr-3 h-8 w-8 text-primary" /> {pageContent.title}</> : "Developer Guide"
            }
          </CardTitle>
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
            <p>No content available for this page.</p>
          )}
           {!isLoading && !error && pageContent?.id === PAGE_ID && pageContent.content.includes("Enter content here.") && (
             <p className="mt-6 text-sm text-muted-foreground italic">
                The content for this page has not been set up yet. Please edit it in the admin panel.
            </p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
