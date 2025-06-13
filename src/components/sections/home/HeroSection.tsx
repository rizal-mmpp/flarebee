
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-background to-card">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Sparkles className="h-4 w-4 mr-2" />
          <span>Powered by AI & Modern Design</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          Launch Your Next Project with RIO Templates
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Accelerate your projects with our collection of high-quality, ready-to-use templates, built with modern tech to help you ship faster and look stunning.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="group bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 ease-in-out transform hover:scale-105">
            <Link href="/templates">
              Explore Templates
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="group border-primary text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out transform hover:scale-105">
            <Link href="#featured"> {/* Assuming #featured ID exists on the FeaturedTemplatesSection or similar */}
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
