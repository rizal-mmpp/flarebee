
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { SitePage } from '@/lib/types';

const PAGE_ID = "business-model";
const DEFAULT_CONTENT = `# Business Model for RIO Templates

## Overview
This document outlines potential business models for the RIO Templates platform.

## 1. Direct Sales (Current Shop Model)
Templates are sold individually.
- **Pros:** Simple, direct revenue.
- **Cons:** Relies on continuous new sales.

## 2. Freemium Model
Offer basic templates for free, premium ones for a cost.
- **Pros:** Attracts users, potential upsell.
- **Cons:** Balancing free/paid, conversion rate.

## 3. Subscription Model
Recurring fee for access to all or tiered templates.
- **Pros:** Predictable revenue, user loyalty.
- **Cons:** Requires constant value addition.

## 4. Hybrid Approach
Combine elements, e.g., some free, individual sales, and an optional subscription.

## Considerations for RIO
The platform currently supports direct sales. Freemium is feasible. Subscriptions require more dev.

---
*This page is content-managed. Please update it in the admin panel.*
`;

export default function BusinessModelPage() {
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
          content.content = DEFAULT_CONTENT;
          content.title = "Business Model";
        } else if (!content) {
            content = {
                id: PAGE_ID,
                title: "Business Model",
                content: DEFAULT_CONTENT,
                updatedAt: new Date().toISOString(),
            }
        }
        setPageContent(content);
      } catch (err: any) {
        console.error("Error fetching Business Model page content:", err);
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
             {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <><Lightbulb className="mr-3 h-8 w-8 text-primary" /> {pageContent?.title || "Business Model"}</>}
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
            <p>Content for the Business Model page is not available.</p>
          )}
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
