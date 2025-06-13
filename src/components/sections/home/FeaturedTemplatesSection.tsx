
import { getLimitedTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { TemplateCard } from '@/components/shared/TemplateCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ServerCrash } from 'lucide-react';
import type { Template } from '@/lib/types';

export const revalidate = 300; // Revalidate featured templates every 5 minutes

async function getFeaturedTemplates(): Promise<Template[]> {
  try {
    // Fetch, for example, 3 templates ordered by creation date or a specific "featured" flag if you add one
    return await getLimitedTemplatesFromFirestore(3);
  } catch (error) {
    console.error("Failed to fetch featured templates:", error);
    return []; // Return empty array on error
  }
}

export async function FeaturedTemplatesSection() {
  const featuredTemplates = await getFeaturedTemplates();

  return (
    <section id="featured" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6"> {/* Ensured md:px-6 */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Featured Templates
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Handpicked selection of our finest templates to get you started quickly.
        </p>
        {featuredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <ServerCrash className="mx-auto h-12 w-12 mb-4 text-destructive" />
            <p className="text-xl">Could not load featured templates at this time.</p>
            <p>Please check back later.</p>
          </div>
        )}
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
