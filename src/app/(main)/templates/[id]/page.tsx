import { getTemplateById, MOCK_TEMPLATES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Download, Eye, Zap } from 'lucide-react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { AspectRatio } from "@/components/ui/aspect-ratio" // Assuming this exists or is created

// Helper for AspectRatio if not from shadcn
const AspectRatioShadcn = ({ ratio, children, className }: { ratio: number, children: React.ReactNode, className?: string }) => (
  <div style={{ position: 'relative', width: '100%', paddingBottom: `${100 / ratio}%` }} className={className}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>{children}</div>
  </div>
);


export async function generateStaticParams() {
  return MOCK_TEMPLATES.map((template) => ({
    id: template.id,
  }));
}

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const template = getTemplateById(params.id);

  if (!template) {
    notFound();
  }

  // Placeholder for Stripe Checkout Action
  const handlePurchase = async () => {
    'use server';
    // In a real app, you'd call your Stripe checkout action here:
    // const checkoutUrl = await createCheckoutSession(template.id, template.price);
    // redirect(checkoutUrl);
    console.log(`Attempting to purchase ${template.title}`);
    // For demo, redirect to a success page or show a toast
    // For now, we'll just log. A real implementation would redirect to Stripe.
    alert(`Purchasing ${template.title} for $${template.price}. This would normally redirect to Stripe.`);
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
                     <AspectRatioShadcn ratio={16 / 9} className="bg-muted rounded-lg">
                       <Image
                        src={src}
                        alt={`${template.title} screenshot ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                        data-ai-hint="template screenshot"
                      />
                    </AspectRatioShadcn>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="ml-12" />
              <CarouselNext className="mr-12" />
            </Carousel>
          ) : (
            <AspectRatioShadcn ratio={16 / 9} className="bg-muted rounded-lg shadow-xl overflow-hidden">
              <Image
                src={template.imageUrl}
                alt={template.title}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                data-ai-hint="template image"
              />
            </AspectRatioShadcn>
          )}
        </div>

        <div className="py-4">
          <Badge variant="secondary" className="mb-2">{template.category.name}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{template.title}</h1>
          <p className="text-4xl font-extrabold text-primary mb-6">${template.price}</p>
          
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
