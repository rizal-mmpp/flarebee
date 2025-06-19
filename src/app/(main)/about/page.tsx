
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getSitePageContent } from '@/lib/firebase/firestoreSitePages';
import type { PublicAboutPageContent, PublicAboutPageServiceItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Target, Eye, Users, Zap, Layers, Globe, Building, MessageCircle, Sparkles, Award, Users2, Lightbulb } from 'lucide-react';
import { DEFAULT_SETTINGS } from '@/lib/constants'; // For default page title

// Helper to dynamically get Lucide icons
const LucideIcon = ({ name, className }: { name: string, className?: string }) => {
  const icons: { [key: string]: React.ElementType } = {
    Globe, Code: Globe, Zap, Layers, CheckCircle, Target, Eye, Users, Building, MessageCircle, Sparkles, Award, Users2, Lightbulb
  };
  const IconComponent = icons[name] || Sparkles; // Default to Sparkles if icon not found
  return <IconComponent className={className} />;
};


export default function PublicAboutPage() {
  const [pageContent, setPageContent] = useState<PublicAboutPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      setError(null);
      try {
        const content = await getSitePageContent('public-about');
        if (content && content.id === 'public-about') {
          setPageContent(content as PublicAboutPageContent);
        } else {
          // This case implies default content was returned or an error structure
          const defaultContentOnError = (await getSitePageContent('public-about')) as PublicAboutPageContent;
          setPageContent(defaultContentOnError);
          if(content?.title === "Error Loading Page" || (content as PublicAboutPageContent)?.pageTitle === 'Error Loading About Page') {
            setError(content.content || "Failed to load content. Default content might be shown.");
          } else {
            // This means no specific 'public-about' data, but some default structure was returned
            console.warn("No specific 'public-about' data found, using defaults.");
          }
        }
      } catch (err: any) {
        console.error("Error fetching public-about page content:", err);
        setError(err.message || "Failed to load content. Please try again later.");
        const defaultContentOnCatch = (await getSitePageContent('public-about')) as PublicAboutPageContent;
        setPageContent(defaultContentOnCatch);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading About Us page...</p>
      </div>
    );
  }
  
  // If there's an error AND pageContent is still using the error title from default fallback
  if (error && pageContent?.pageTitle === 'Error Loading About Page') {
    return (
       <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Page</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!pageContent) { // Fallback if pageContent is truly null after loading and error checks
    return (
      <div className="text-center py-10 container mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">About Us content is not available at the moment.</p>
         <Button variant="outline" asChild className="mt-4 group">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const { 
    pageTitle = DEFAULT_SETTINGS.siteTitle, // Default to site title if pageTitle is somehow missing
    heroSection, 
    historySection, 
    founderSection, 
    missionVisionSection,
    servicesIntroSection,
    servicesHighlights,
    companyOverviewSection,
    callToActionSection 
  } = pageContent;

  const SectionWrapper: React.FC<{children: React.ReactNode, className?: string, id?: string, bgClassName?: string}> = 
    ({children, className, id, bgClassName = 'bg-background'}) => (
    <section id={id} className={`py-12 md:py-20 ${bgClassName} ${className}`}>
      <div className="container mx-auto px-4 md:px-6">
        {children}
      </div>
    </section>
  );

  const ServiceHighlightCard: React.FC<{item: PublicAboutPageServiceItem}> = ({item}) => (
    <Card className="text-center p-6 bg-card hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <div className="mb-5 inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mx-auto">
            <LucideIcon name={item.icon} className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{item.name}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{item.description}</p>
    </Card>
  );

  return (
    <div className="text-foreground">
      {/* Hero Section */}
      <SectionWrapper 
        id="hero" 
        bgClassName="bg-gradient-to-br from-card to-background"
        className="text-center pt-20 md:pt-28 pb-16 md:pb-24"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-foreground leading-tight">
          {heroSection.tagline}
        </h1>
        {heroSection.subTagline && <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">{heroSection.subTagline}</p>}
        {heroSection.imageUrl && (
          <div className="relative w-full max-w-4xl aspect-[16/9] mx-auto mb-12 rounded-2xl overflow-hidden shadow-2xl border-4 border-card">
            <Image src={heroSection.imageUrl} alt="Hero Image" fill style={{objectFit:"cover"}} data-ai-hint={heroSection.imageAiHint || "abstract company visual"} priority />
          </div>
        )}
        {heroSection.ctaButtonText && heroSection.ctaButtonLink && (
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg rounded-full">
            <Link href={heroSection.ctaButtonLink}>{heroSection.ctaButtonText}</Link>
          </Button>
        )}
      </SectionWrapper>

      {/* History Section */}
      <SectionWrapper id="history" bgClassName="bg-background">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{historySection.title}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-md">{historySection.text}</p>
          </div>
          {historySection.imageUrl && (
            <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border order-1 md:order-2">
              <Image src={historySection.imageUrl} alt={historySection.title} fill style={{objectFit:"cover"}} data-ai-hint={historySection.imageAiHint || "company journey visual"} />
            </div>
          )}
        </div>
      </SectionWrapper>
      
      {/* Founder Section */}
      <SectionWrapper id="founder" bgClassName="bg-card">
        <div className="grid md:grid-cols-1 lg:grid-cols-5 gap-10 md:gap-16 items-center">
          {founderSection.imageUrl && (
            <div className="relative w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-2xl border-4 border-primary mx-auto lg:mx-0 lg:col-span-2">
              <Image src={founderSection.imageUrl} alt={founderSection.name} fill style={{objectFit:"cover"}} data-ai-hint={founderSection.imageAiHint || "founder photo"} />
            </div>
          )}
          <div className={`lg:col-span-${founderSection.imageUrl ? '3' : '5'} text-center lg:text-left`}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{founderSection.name}</h2>
            <p className="text-xl text-primary font-semibold mb-5">{founderSection.title}</p>
            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
              <p>{founderSection.bio}</p>
            </div>
          </div>
        </div>
      </SectionWrapper>
      
      {/* Mission & Vision Section */}
      {missionVisionSection && (missionVisionSection.missionText || missionVisionSection.visionText) && (
        <SectionWrapper id="mission-vision" bgClassName="bg-background">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
            {missionVisionSection.missionText && (
                <div className="p-6 md:p-8 rounded-xl border bg-card shadow-lg">
                    <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-5 flex items-center">
                        <Target className="mr-3 h-7 w-7 text-primary"/> {missionVisionSection.missionTitle || "Our Mission"}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6 text-md">{missionVisionSection.missionText}</p>
                    {missionVisionSection.missionImageUrl && (
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-md border">
                            <Image src={missionVisionSection.missionImageUrl} alt="Mission" fill style={{objectFit:"cover"}} data-ai-hint={missionVisionSection.missionImageAiHint || "mission visual"} />
                        </div>
                    )}
                </div>
            )}
            {missionVisionSection.visionText && (
                 <div className="p-6 md:p-8 rounded-xl border bg-card shadow-lg">
                    <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-5 flex items-center">
                        <Eye className="mr-3 h-7 w-7 text-primary"/> {missionVisionSection.visionTitle || "Our Vision"}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6 text-md">{missionVisionSection.visionText}</p>
                     {missionVisionSection.visionImageUrl && (
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-md border">
                            <Image src={missionVisionSection.visionImageUrl} alt="Vision" fill style={{objectFit:"cover"}} data-ai-hint={missionVisionSection.visionImageAiHint || "vision visual"} />
                        </div>
                    )}
                </div>
            )}
            </div>
        </SectionWrapper>
      )}

      {/* Services Section */}
      {servicesIntroSection && servicesHighlights && servicesHighlights.length > 0 && (
        <SectionWrapper id="services" bgClassName="bg-card">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{servicesIntroSection.title}</h2>
            <p className="text-md text-muted-foreground leading-relaxed">{servicesIntroSection.introText}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {servicesHighlights.map((service) => (
              <ServiceHighlightCard key={service.id} item={service} />
            ))}
          </div>
        </SectionWrapper>
      )}

      {/* Company Overview Section */}
      <SectionWrapper id="overview" bgClassName="bg-background">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {companyOverviewSection.imageUrl && (
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border order-1">
              <Image src={companyOverviewSection.imageUrl} alt={companyOverviewSection.title} fill style={{objectFit:"cover"}} data-ai-hint={companyOverviewSection.imageAiHint || "company culture visual"} />
              </div>
          )}
          <div className={`order-2 ${!companyOverviewSection.imageUrl ? 'md:col-span-2 text-center max-w-3xl mx-auto' : ''}`}>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{companyOverviewSection.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-md">{companyOverviewSection.text}</p>
          </div>
          </div>
      </SectionWrapper>

      {/* Call to Action Section */}
      <SectionWrapper id="cta" bgClassName="bg-gradient-to-tr from-primary/5 via-background to-accent/5 border-t border-border">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5">{callToActionSection.title}</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed text-lg">{callToActionSection.text}</p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-7 text-lg rounded-full shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105">
            <Link href={callToActionSection.buttonLink}>{callToActionSection.buttonText}</Link>
          </Button>
        </div>
      </SectionWrapper>

       <div className="container mx-auto px-4 md:px-6 py-12 text-center">
          <Button variant="outline" asChild className="group">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </Button>
        </div>
    </div>
  );
}
