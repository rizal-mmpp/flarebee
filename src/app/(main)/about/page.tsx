
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Users, Target, Eye, Building } from 'lucide-react';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { SitePage } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const PAGE_ID = "public-about";

export default function PublicAboutPage() {
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
          setError(`Content for "${PAGE_ID}" could not be loaded. Please create it in the admin panel.`);
          setPageContent({
            id: PAGE_ID,
            title: "About Us",
            content: `# About Us\n\nDefault content for the public about page. Please edit this in the admin panel. \n\n## Our Mission\n\n[Enter mission here]\n\n## Our Vision\n\n[Enter vision here]\n\n## Our Values\n\n- Value 1\n- Value 2\n- Value 3\n\n## Our Team\n\n[Describe team here]`,
            updatedAt: new Date().toISOString()
          });
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

  const TeamMemberCard = ({ name, role, imageUrl, dataAiHint }: { name: string, role: string, imageUrl: string, dataAiHint: string }) => (
    <Card className="text-center overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="relative w-full h-56 sm:h-64">
        <Image src={imageUrl} alt={name} fill style={{objectFit:"cover"}} data-ai-hint={dataAiHint} />
      </div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription className="text-primary">{role}</CardDescription>
      </CardHeader>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </Button>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading About Us page...</p>
        </div>
      ) : error ? (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/80">{error}</p>
            </CardContent>
          </Card>
      ) : pageContent ? (
        <div className="space-y-12">
          <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {pageContent.title || "About Ragam Inovasi Optima"}
            </h1>
            <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground max-w-3xl">
              <ReactMarkdown components={{
                h1: ({node, ...props}) => null, // Remove h1 from markdown as we have a main title
                h2: ({node, ...props}) => <h2 className="text-2xl md:text-3xl font-semibold text-foreground mt-8 mb-3 scroll-m-20" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-2 scroll-m-20" {...props} />,
                p: ({node, ...props}) => <p className="leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-1" {...props} />,
                strong: ({node, ...props}) => <strong className="text-foreground/90" {...props} />,
              }}>
                {pageContent.content}
              </ReactMarkdown>
            </div>
          </section>

          <Separator />

          {/* Placeholder sections to be filled by Markdown or future structured content */}
          {/* The ReactMarkdown above will render H2s from the markdown content for Mission, Vision, Values etc. */}
          
          <section id="team">
            <h2 className="text-3xl font-bold text-center text-foreground mb-8">Meet Our Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Team members can be added here structurally or described in the Markdown */}
              <TeamMemberCard name="Rizal M" role="Founder & Lead Innovator" imageUrl="https://placehold.co/400x500.png" dataAiHint="male portrait" />
              <TeamMemberCard name="AI Assistant" role="Chief Efficiency Officer" imageUrl="https://placehold.co/400x500.png" dataAiHint="robot head" />
              <TeamMemberCard name="Future Developer" role="Growth Engineer" imageUrl="https://placehold.co/400x500.png" dataAiHint="person coding" />
               <TeamMemberCard name="Client Success" role="Relationship Manager" imageUrl="https://placehold.co/400x500.png" dataAiHint="friendly person" />
            </div>
          </section>
          
          {!isLoading && !error && pageContent?.id === PAGE_ID && pageContent.content.includes("Enter content here.") && (
             <p className="mt-6 text-sm text-muted-foreground italic text-center">
                The main content for this page has not been set up yet. Please edit it in the admin panel.
            </p>
           )}
        </div>
      ) : (
         <div className="text-center py-10">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">About Us content is not available.</p>
        </div>
      )}
    </div>
  );
}

