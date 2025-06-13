
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 md:px-6 text-center"> {/* Ensured md:px-6 */}
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Sparkles className="h-4 w-4 mr-2" />
          <span>Powered by AI & Modern Design</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          Launch Faster with Modern Templates
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Browse ready-to-use templates built with cutting-edge technology. Ship your projects quicker and impress your users.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="group bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/templates">
              Explore Templates
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="link" size="lg" className="text-primary hover:text-primary/90 hover:no-underline">
            <Link href="#featured">
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
