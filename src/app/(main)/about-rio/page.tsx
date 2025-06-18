
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Info } from 'lucide-react';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { SitePage } from '@/lib/types';

const PAGE_ID = "about-rio";
const DEFAULT_CONTENT = `# About Ragam Inovasi Optima (RIO)

## Our Vision
Enter vision statement here...

## Our Mission
Enter mission statement here...

## Our Services
- Service 1: Description...
- Service 2: Description...

## Business Model Overview
RIO Templates operates on a [Direct Sales/Freemium/Subscription - choose or elaborate] model.
More details about our business model can be found [here if separate, or elaborate].

---
*This page is content-managed. Please update it in the admin panel.*
`;


export default function AboutRioPage() {
  const [pageContent, setPageContent] = useState<SitePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      setError(null);
      try {
        let content = await getSitePageContent(PAGE_ID);
        if (content && content.content.includes("Enter content here.")) {
          // If it's the default placeholder from firestoreSitePages, use the more detailed one
          content.content = DEFAULT_CONTENT;
          content.title = "About RIO"; // Ensure title matches
        } else if (!content) {
            content = {
                id: PAGE_ID,
                title: "About RIO",
                content: DEFAULT_CONTENT,
                updatedAt: new Date().toISOString(),
            }
        }
        setPageContent(content);
      } catch (err: any) {
        console.error("Error fetching About RIO page content:", err);
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
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <><Info className="mr-3 h-8 w-8 text-primary" /> {pageContent?.title || "About RIO"}</>}
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
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown>{pageContent.content}</ReactMarkdown>
            </div>
          ) : (
            <p>Content for the About RIO page is not available.</p>
          )}
           {/* Reminder for default content */}
           {!isLoading && !error && pageContent?.content.includes("Enter content here.") && (
             <p className="mt-6 text-sm text-muted-foreground italic">
                The main content for this page has not been fully set up yet. Please edit it in the admin panel.
            </p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
