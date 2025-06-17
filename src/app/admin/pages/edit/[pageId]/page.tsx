
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileEdit, Save, Loader2, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import { updateSitePageContentAction } from '@/lib/actions/sitePage.actions';
import type { SitePage } from '@/lib/types';

const pageContentSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content cannot be empty.'),
});
type PageContentFormValues = z.infer<typeof pageContentSchema>;

export default function EditSitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const pageId = params.pageId as string;

  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [initialPageData, setInitialPageData] = useState<SitePage | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PageContentFormValues>({
    resolver: zodResolver(pageContentSchema),
    defaultValues: {
        title: '',
        content: '',
    }
  });

  useEffect(() => {
    if (pageId) {
      setIsLoadingContent(true);
      setContentError(null);
      getSitePageContent(pageId)
        .then((data) => {
          if (data) {
            setInitialPageData(data);
            setValue('title', data.title);
            setValue('content', data.content);
          } else {
            setContentError(`Content for page ID "${pageId}" not found or could not be loaded.`);
          }
        })
        .catch((err) => {
          console.error("Error fetching page content:", err);
          setContentError("Failed to load page content. Please try again.");
        })
        .finally(() => {
          setIsLoadingContent(false);
        });
    }
  }, [pageId, setValue]);

  const onSubmit: SubmitHandler<PageContentFormValues> = (data) => {
    startSaveTransition(async () => {
      const result = await updateSitePageContentAction(pageId, data.title, data.content);
      if (result.success) {
        toast({
          title: 'Content Saved',
          description: `Content for "${data.title}" has been successfully updated.`,
        });
        router.push('/admin/pages');
      } else {
        toast({
          title: 'Error Saving Content',
          description: result.error || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const pageDisplayTitle = initialPageData?.title || pageId.replace(/-/g, ' ');

  if (isLoadingContent) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading page content...</p>
      </div>
    );
  }

  if (contentError) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground mb-6">{contentError}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/pages">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pages
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <FileEdit className="mr-3 h-8 w-8 text-primary" />
          Edit Page: <span className="ml-2 font-medium">{pageDisplayTitle}</span>
        </h1>
        <div className="flex gap-3 flex-col sm:flex-row w-full md:w-auto">
            <Button variant="outline" type="button" onClick={() => router.push('/admin/pages')} className="w-full sm:w-auto group" disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Pages
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Content
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Content Editor</CardTitle>
          <CardDescription>
            Use Markdown for formatting. The content will be rendered on the public site.
            <br />
            Page ID: <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm text-xs">{pageId}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div>
            <Label htmlFor="title" className="text-base">Page Title</Label>
            <Input 
              id="title" 
              {...register('title')} 
              className="mt-1 text-lg"
              placeholder="Enter the title for this page"
            />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="content" className="text-base">Page Content (Markdown)</Label>
            <Textarea
              id="content"
              {...register('content')}
              rows={20}
              className="mt-1 font-mono text-sm"
              placeholder={`# Your Page Title (e.g., ## Heading 2)\n\nYour content here... Use Markdown for formatting.\n\n- Bullet point 1\n- Bullet point 2\n\n[Link example](https://example.com)`}
            />
            {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
            <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Content
            </Button>
        </CardFooter>
      </Card>
       <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Using Markdown
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 dark:text-blue-300 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
          <p>You can use common Markdown syntax to format your text:</p>
          <ul>
            <li><code># Heading 1</code>, <code>## Heading 2</code>, etc.</li>
            <li><code>**Bold text**</code> for <strong>bold</strong></li>
            <li><code>*Italic text*</code> or <code>_Italic text_</code> for <em>italics</em></li>
            <li><code>[Link text](https://example.com)</code> for links</li>
            <li><code>- Item 1</code><br /><code>- Item 2</code> for bullet lists</li>
            <li><code>1. Item 1</code><br /><code>2. Item 2</code> for numbered lists</li>
            <li><code>`Inline code`</code> for <code>inline code</code></li>
            <li><code>&gt; Blockquote</code> for blockquotes</li>
          </ul>
          <p>Changes will be reflected on the public page after saving.</p>
        </CardContent>
      </Card>
    </form>
  );
}
