
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
const DEFAULT_CONTENT = `# Developer Guide for RIO Templates

## Project Setup
1. Clone repo.
2. Install dependencies (\`pnpm install\`).
3. Setup Firebase (Project, Firestore, Auth, .env.local).
4. Setup Xendit (.env.local).
5. Setup Vercel Blob (.env.local).
6. Run dev server (\`pnpm dev\`).

## Tech Stack
- Next.js (App Router), TypeScript
- React, ShadCN UI, Tailwind CSS
- Firebase (Auth, Firestore)
- Xendit (Payments)
- Genkit (AI - Example)
- Vercel Blob (File Storage)

## Key Directories
- \`src/app\`: Routes & Layouts
- \`src/components\`: UI Components
- \`src/lib\`: Core logic, Firebase, Server Actions
- \`src/context\`: React Context

## Coding Conventions
- Next.js App Router best practices.
- TypeScript.
- ShadCN UI & Tailwind.
- Responsive design.

---
*This page is content-managed. Please update it in the admin panel.*
`;


export default function DeveloperGuidePage() {
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
          content.title = "Developer Guide";
        } else if (!content) {
            content = {
                id: PAGE_ID,
                title: "Developer Guide",
                content: DEFAULT_CONTENT,
                updatedAt: new Date().toISOString(),
            }
        }
        setPageContent(content);
      } catch (err: any) {
        console.error("Error fetching Developer Guide page content:", err);
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
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <><Wrench className="mr-3 h-8 w-8 text-primary" /> {pageContent?.title || "Developer Guide"}</>}
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
            <p>Content for the Developer Guide page is not available.</p>
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
