
import { getTemplateByIdFromFirestore, getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Eye, Zap } from 'lucide-react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { createXenditInvoice } from '@/lib/actions/xendit.actions'; // Use Xendit action
import { toast } from '@/hooks/use-toast'; // For displaying errors

// Revalidate this page on-demand or at intervals
export const revalidate = 60; // Revalidate every 60 seconds, or use 0 for on-demand with revalidatePath

export async function generateStaticParams() {
  try {
    const templates = await getAllTemplatesFromFirestore();
    return templates.map((template) => ({
      id: template.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params for templates:", error);
    return [];
  }
}

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const template = await getTemplateByIdFromFirestore(params.id);

  if (!template) {
    notFound();
  }
  
  const handlePurchase = async () => {
    'use server';
    
    // Price is passed as is, Xendit handles currency format.
    // Assuming template.price is in USD.
    const result = await createXenditInvoice({
      templateId: template.id,
      templateName: template.title,
      price: template.price, // Pass the price directly
      currency: 'USD', // Specify currency
      // payerEmail: user?.email // If user is logged in and you want to prefill
      // userId: user?.id // If you have user auth and want to associate purchase
    });

    if (result?.invoiceUrl) {
        redirect(result.invoiceUrl);
    } else if (result?.error) {
        // Instead of redirecting with error, we should show a toast or an alert on the current page.
        // For now, we will log and redirect back to the template page with an error query param.
        // A better UX would be to display the error directly on this page.
        console.error("Xendit Error:", result.error);
        // This redirect isn't ideal as it won't show the error on THIS page.
        // A client-side handling of this error would be better (e.g., using useTransition and showing toast).
        // For a server action redirecting, this is a simple way to indicate an issue.
        const errorMessage = encodeURIComponent(result.error || "Payment processing failed. Please try again.");
        redirect(`/templates/${params.id}?error=${errorMessage}`);
    }
  };


  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/templates">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Templates
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {template.screenshots && template.screenshots.length > 0 ? (
            <Carousel className="w-full rounded-lg overflow-hidden shadow-xl">
              <CarouselContent>
                {[template.imageUrl, ...template.screenshots].map((src, index) => (
                  <CarouselItem key={index}>
                     <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
                       <Image
                        src={src}
                        alt={`${template.title} screenshot ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                        data-ai-hint={template.dataAiHint || "template screenshot"}
                      />
                    </AspectRatio>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="ml-12" />
              <CarouselNext className="mr-12" />
            </Carousel>
          ) : (
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg shadow-xl overflow-hidden">
              <Image
                src={template.imageUrl}
                alt={template.title}
                fill
                className="rounded-lg object-cover"
                data-ai-hint={template.dataAiHint || "template image"}
              />
            </AspectRatio>
          )}
        </div>

        <div className="py-4">
          <Badge variant="secondary" className="mb-2">{template.category.name}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{template.title}</h1>
          <p className="text-4xl font-extrabold text-primary mb-6">${template.price.toFixed(2)}</p>
          
          <div className="mb-6 prose prose-invert max-w-none text-muted-foreground">
             <p>{template.longDescription || template.description}</p>
          </div>

          {template.techStack && template.techStack.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" /> Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.techStack.map((tech) => (
                  <Badge key={tech} variant="outline">{tech}</Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-8">
             <h3 className="text-lg font-semibold text-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Client-side error display (optional enhancement, not implemented here due to server action redirect) */}
          {/* {searchParams?.error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/20 text-destructive border border-destructive">
              <p><strong>Error:</strong> {searchParams.error}</p>
            </div>
          )} */}

          <form action={handlePurchase} className="space-y-4">
            <Button type="submit" size="lg" className="w-full group bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300 ease-in-out transform hover:scale-105">
              <CreditCard className="mr-2 h-5 w-5" /> Purchase Now
            </Button>
            {template.previewUrl && template.previewUrl !== '#' && (
               <Button variant="outline" size="lg" asChild className="w-full group border-primary text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out transform hover:scale-105">
                <Link href={template.previewUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-5 w-5" /> Live Preview
                </Link>
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
