'use client';

import { useState, useMemo } from 'react';
import { CATEGORIES, MOCK_TEMPLATES } from '@/lib/constants';
import { CategoryFilter } from '@/components/sections/templates/CategoryFilter';
import { TemplateGrid } from '@/components/sections/templates/TemplateGrid';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectCategory = (slug: string | null) => {
    setSelectedCategory(slug);
  };

  const filteredTemplates = useMemo(() => {
    return MOCK_TEMPLATES.filter((template) => {
      const categoryMatch = selectedCategory ? template.category.slug === selectedCategory : true;
      const searchMatch = searchTerm
        ? template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      return categoryMatch && searchMatch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Explore Our Templates</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find the perfect starting point for your next project. Filter by category or search by keyword.
        </p>
      </div>
      
      <div className="mb-8 max-w-xl mx-auto relative">
        <Input 
          type="text"
          placeholder="Search templates (e.g., 'dashboard', 'react', 'portfolio')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-base h-12 rounded-md"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      <CategoryFilter
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      <TemplateGrid templates={filteredTemplates} />
    </div>
  );
}
