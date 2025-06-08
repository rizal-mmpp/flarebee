
'use client'; // Needs to be client component for cart interaction and potential client-side error display

import type { Template } from '@/lib/types';
import { getTemplateByIdFromFirestore, getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { notFound, useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Eye, Zap, ShoppingCart, Loader2, ServerCrash } from 'lucide-react'; // Removed LogIn
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useCart } from '@/context/CartContext'; // Import useCart
import { use, useEffect, useState, useTransition } from 'react'; // Import use
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/firebase/AuthContext'; // Import useAuth
import { LoginModal } from '@/components/shared/LoginModal'; // Import the new LoginModal

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart, isItemInCart } = useCart();
  const { user, signInWithGoogle } = useAuth(); // Get user and signInWithGoogle from AuthContext
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isBuyNowPending, startBuyNowTransition] = useTransition();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTemplate() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTemplate = await getTemplateByIdFromFirestore(id);
        if (!fetchedTemplate) {
          notFound();
          return;
        }
        setTemplate(fetchedTemplate);
      } catch (err) {
        console.error("Failed to fetch template:", err);
        setError("Could not load template details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      fetchTemplate();
    }

    const xenditError = searchParams?.get('error');
    if (xenditError) {
      toast({
        title: "Payment Error",
        description: decodeURIComponent(xenditError),
        variant: "destructive",
      });
      router.replace(`/templates/${id}`, { scroll: false });
    }

  }, [id, searchParams, router]);


  const handleAddToCart = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (template) {
      addToCart(template);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (template) {
      startBuyNowTransition(() => {
        addToCart(template);
        router.push('/checkout');
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16 text-center">
         <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Template</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
      </div>
    );
  }

  if (!template) {
    return notFound(); 
  }
  
  const itemAlreadyInCart = user ? isItemInCart(template.id) : false;

  return (
    <>
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
                          priority={index === 0}
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
                  priority
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
            
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full group bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300 ease-in-out transform hover:scale-105"
                onClick={handleBuyNow}
                disabled={isBuyNowPending}
              >
                {isBuyNowPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                Buy Now & Checkout
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full group"
                onClick={handleAddToCart}
                disabled={itemAlreadyInCart && user}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {itemAlreadyInCart && user ? 'Already in Cart' : 'Add to Cart'}
              </Button>
              {template.previewUrl && template.previewUrl !== '#' && (
                <Button variant="outline" size="lg" asChild className="w-full group border-primary text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out transform hover:scale-105">
                  <Link href={template.previewUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-5 w-5" /> Live Preview
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
        onLogin={signInWithGoogle} 
      />
    </>
  );
}
