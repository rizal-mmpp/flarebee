import { HeroSection } from '@/components/sections/home/HeroSection';
import { FeaturedTemplatesSection } from '@/components/sections/home/FeaturedTemplatesSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedTemplatesSection />
      {/* Placeholder for additional sections like "Why Flarebee?" or "Testimonials" */}
      <section id="features" className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">More To Come</h2>
          <p className="text-lg text-muted-foreground">This is a placeholder for future content sections.</p>
        </div>
      </section>
    </>
  );
}
