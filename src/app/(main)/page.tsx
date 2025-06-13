
'use client'; 

import { useState, useMemo, useEffect } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { CategoryFilter } from '@/components/sections/templates/CategoryFilter';
import { TemplateGrid } from '@/components/sections/templates/TemplateGrid';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import type { Template } from '@/lib/types';
import { getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';

export default function HomePage() {
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoading(true);
      try {
        const templates = await getAllTemplatesFromFirestore();
        setAllTemplates(templates);
      } catch (error) {
        console.error("Failed to fetch templates for public page:", error);
        // Optionally, set an error state and display a message
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleSelectCategory = (slug: string | null) => {
    setSelectedCategory(slug);
  };

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      const categoryMatch = selectedCategory ? template.category.slug === selectedCategory : true;
      const searchMatch = searchTerm
        ? template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      return categoryMatch && searchMatch;
    });
  }, [selectedCategory, searchTerm, allTemplates]);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Launch Faster with Modern <span className="text-primary">Templates</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse ready-to-use templates built with cutting-edge technology. Ship your projects quicker and impress your users.
        </p>
      </div>
      
      <div className="mb-8 max-w-xl mx-auto relative">
        <Input 
          type="text"
          placeholder="Search templates (e.g., 'dashboard', 'react', 'portfolio')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-base h-12 rounded-xl"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      <CategoryFilter
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <TemplateGrid templates={filteredTemplates} />
      )}
    </div>
  );
}
