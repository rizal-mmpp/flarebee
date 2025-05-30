import { MOCK_TEMPLATES } from '@/lib/constants';
import { TemplateCard } from '@/components/shared/TemplateCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FeaturedTemplatesSection() {
  const featuredTemplates = MOCK_TEMPLATES.slice(0, 3); // Show first 3 as featured

  return (
    <section id="featured" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Featured Templates
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Handpicked selection of our finest templates to get you started quickly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button asChild size="lg" variant="outline" className="group border-accent text-accent hover:bg-accent/10 hover:border-accent transition-all duration-300 ease-in-out transform hover:scale-105">
            <Link href="/templates">
              Explore All Templates
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
