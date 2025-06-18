
import fs from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lightbulb } from 'lucide-react';

async function getStaticMarkdownContent(fileName: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'docs', fileName);
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading static markdown file ${fileName}:`, error);
     return `# Error: Content Not Found\n\nCould not load content for this page. The file \`/public/docs/${fileName}\` may be missing or inaccessible.`;
  }
}

export default async function BusinessModelPage() {
  const markdownContent = await getStaticMarkdownContent('business-model-content.md');
  const pageTitle = "RIO Business Model";

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
            <Lightbulb className="mr-3 h-8 w-8 text-primary" /> {pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <article className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80">
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
