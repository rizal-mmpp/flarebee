
'use client'; 

import { use, useEffect, useState, useTransition } from 'react'; // Import 'use'
import type { Template, Order, CartItem, AuthUser } from '@/lib/types';
import { getTemplateByIdFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { notFound, useRouter, useSearchParams } from 'next/navigation'; 
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Eye, Zap, ShoppingCart, Loader2, ServerCrash, Download, ExternalLink, Github } from 'lucide-react'; 
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useCart } from '@/context/CartContext'; 
import { toast } from '@/hooks/use-toast';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { LoginModal } from '@/components/shared/LoginModal'; 
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import { useAuth as useFirebaseAuth } from '@/lib/firebase/AuthContext';

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Updated props type to reflect params as a Promise
export default function TemplateDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise); // Unwrap the params promise
  const id = params.id;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart, isItemInCart } = useCart();
  const { user } = useCombinedAuth(); 
  const { signInWithGoogle } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const [isBuyNowPending, startBuyNowTransition] = useTransition();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoadingPurchaseStatus, setIsLoadingPurchaseStatus] = useState(true);

  useEffect(() => {
    async function fetchTemplate() {
      setIsLoading(true);
      setError(null);
      try {
        // 'id' is now guaranteed to be resolved here due to use(paramsPromise)
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

  useEffect(() => {
    async function checkPurchaseStatus() {
      if (user && template) {
        setIsLoadingPurchaseStatus(true);
        try {
          const orders = await getOrdersByUserIdFromFirestore(user.uid);
          const purchased = orders.some(order => 
            order.items.some(item => item.id === template.id) && (order.status === 'completed' || order.status === 'pending')
          );
          setHasPurchased(purchased);
        } catch (err) {
          console.error("Failed to check purchase status:", err);
          setHasPurchased(false); 
        } finally {
          setIsLoadingPurchaseStatus(false);
        }
      } else {
        setHasPurchased(false);
        setIsLoadingPurchaseStatus(false);
      }
    }
    if (!isLoading && template) { 
        checkPurchaseStatus();
    }
  }, [user, template, isLoading]);


  const handleAddToCart = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (template) {
      const cartItem: CartItem = {
        id: template.id,
        title: template.title,
        price: template.price,
        imageUrl: template.imageUrl,
        quantity: 1,
      };
      addToCart(cartItem);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (template) {
      startBuyNowTransition(() => {
        if (!isItemInCart(template.id)) {
          const cartItem: CartItem = {
            id: template.id,
            title: template.title,
            price: template.price,
            imageUrl: template.imageUrl,
            quantity: 1,
          };
          addToCart(cartItem);
        }
        router.push('/checkout');
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
         <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Template</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/">
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
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Templates
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {template.screenshots && template.screenshots.length > 0 ? (
            <Carousel className="w-full rounded-xl overflow-hidden border"> 
              <CarouselContent>
                {[template.imageUrl, ...template.screenshots].map((src, index) => (
                  <CarouselItem key={index}>
                    <AspectRatio ratio={16 / 9} className="bg-muted rounded-xl">
                      <Image
                        src={src}
                        alt={`${template.title} screenshot ${index + 1}`}
                        fill
                        className="rounded-xl object-cover"
                        data-ai-hint={template.dataAiHint || "template screenshot"}
                        priority={index === 0}
                         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                      />
                    </AspectRatio>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="ml-12" />
              <CarouselNext className="mr-12" />
            </Carousel>
          ) : (
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-xl border overflow-hidden"> 
              <Image
                src={template.imageUrl}
                alt={template.title}
                fill
                className="rounded-xl object-cover"
                data-ai-hint={template.dataAiHint || "template image"}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              />
            </AspectRatio>
          )}
        </div>

        <div className="py-4">
          <Badge variant="secondary" className="mb-2">{template.category.name}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{template.title}</h1>
          {!hasPurchased && <p className="text-4xl font-extrabold text-primary mb-6">{formatIDR(template.price)}</p>}
          
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
                <Badge key={tag} variant="outline" className="text-xs text-muted-foreground border-muted-foreground/40 rounded-full font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {isLoadingPurchaseStatus && (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoadingPurchaseStatus && hasPurchased && (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-1">You own this template!</h3>
                <Button 
                  size="lg" 
                  asChild
                  className="w-full group bg-green-600 hover:bg-green-700 text-white transition-all duration-300 ease-in-out"
                  disabled={!template.downloadZipUrl || template.downloadZipUrl === '#'}
                >
                  <Link href={template.downloadZipUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" /> Download ZIP
                  </Link>
                </Button>
                {template.githubUrl && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    asChild 
                    className="w-full group"
                  >
                    <Link href={template.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-5 w-5" /> Visit GitHub
                    </Link>
                  </Button>
                )}
              </>
            )}

            {!isLoadingPurchaseStatus && !hasPurchased && (
              <>
                <Button 
                  size="lg" 
                  className="w-full group bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300 ease-in-out"
                  onClick={handleBuyNow}
                  disabled={isBuyNowPending || (itemAlreadyInCart && user)}
                >
                  {isBuyNowPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                  {itemAlreadyInCart && user ? 'Go to Checkout (In Cart)' : 'Buy Now & Checkout'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full group"
                  onClick={handleAddToCart}
                  disabled={(itemAlreadyInCart && user) || isBuyNowPending}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {itemAlreadyInCart && user ? 'Already in Cart' : 'Add to Cart'}
                </Button>
              </>
            )}
            
            {template.previewUrl && template.previewUrl !== '#' && (
              <Button variant="outline" size="lg" asChild className="w-full group border-primary text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out">
                <Link href={template.previewUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-5 w-5" /> Live Preview
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
        onLogin={signInWithGoogle} 
      />
    </div>
  );
}
