
'use client'; 

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';
import { CategoryFilter } from '@/components/sections/templates/CategoryFilter';
import { TemplateGrid } from '@/components/sections/templates/TemplateGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X, ArrowUpRight } from 'lucide-react';
import type { Template } from '@/lib/types';
import { getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { cn } from '@/lib/utils';

const SEARCH_SUGGESTIONS = [
  "dashboard",
  "e-commerce",
  "portfolio",
  "SaaS",
  "landing page",
  "AI powered",
  "utility",
  "POS",
];

export default function HomePage() {
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoading(true);
      try {
        const templates = await getAllTemplatesFromFirestore();
        setAllTemplates(templates);
      } catch (error) {
        console.error("Failed to fetch templates for public page:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  useEffect(() => {
    const categoryFromQuery = searchParams.get('category');
    if (categoryFromQuery && CATEGORIES.some(cat => cat.slug === categoryFromQuery)) {
      setSelectedCategory(categoryFromQuery);
    } else if (!categoryFromQuery) { // Only reset if no category query param
      setSelectedCategory(null);
    }
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchActive(false);
      }
    }
    if (isSearchActive) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchActive]);

  const handleSelectCategory = (slug: string | null) => {
    setSelectedCategory(slug);
    router.push(slug ? `/?category=${slug}` : '/', { scroll: false });
    setIsSearchActive(false); 
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setIsSearchActive(false); 
    inputRef.current?.focus();
  };

  const handleClearOrCancelSearch = () => {
    if (searchTerm) {
      setSearchTerm('');
      inputRef.current?.focus();
    } else {
      setIsSearchActive(false);
      inputRef.current?.blur();
    }
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
        <h1 className="text-4xl md:text-5xl font-happy-monkey text-foreground mb-4">
          Launch <span className="italic font-normal text-muted-foreground">Faster</span> with Modern <span className="text-accent">Templates</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse ready-to-use templates built with cutting-edge technology. Ship your projects quicker and impress your users.
        </p>
      </div>
      
      <div ref={searchContainerRef} className="mb-8 max-w-xl mx-auto relative">
        <div className="relative flex items-center">
          <Search 
            className={cn(
              "absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none z-10",
              isSearchActive ? "text-primary" : "text-muted-foreground"
            )} 
          />
          <Input 
            ref={inputRef}
            type="text"
            placeholder="What are you looking for?"
            value={searchTerm}
            onFocus={() => setIsSearchActive(true)}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-10 pr-10 text-base h-12 transition-all duration-150 ease-in-out w-full rounded-full", // Added pr-10 for X icon space
              isSearchActive 
                ? "bg-background border border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" 
                : "bg-muted border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
          />
          {isSearchActive && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClearOrCancelSearch} 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              aria-label={searchTerm ? "Clear search" : "Cancel search"}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {isSearchActive && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg p-3 z-20 max-h-72 overflow-y-auto">
            {searchTerm.length === 0 && (
              <>
                <p className="text-xs text-muted-foreground px-2 pb-2 pt-1">Try searching for:</p>
                <ul className="space-y-1">
                  {SEARCH_SUGGESTIONS.map((suggestion) => (
                    <li 
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer text-sm group"
                    >
                      <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      <span className="text-foreground/80 group-hover:text-foreground">{suggestion}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground ml-auto" />
                    </li>
                  ))}
                </ul>
              </>
            )}
            {searchTerm.length > 0 && filteredTemplates.length > 0 && !isLoading && (
                 <>
                    <p className="text-xs text-muted-foreground px-2 pb-2 pt-1">Matching templates:</p>
                    <ul className="space-y-1">
                    {filteredTemplates.slice(0, 5).map(template => (
                        <li
                        key={template.id}
                        onClick={() => {
                            // Navigate to template page or fill search, depending on desired UX
                            // For now, let's fill search and close suggestions
                            setSearchTerm(template.title);
                            setIsSearchActive(false);
                            router.push(`/templates/${template.id}`);
                        }}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer text-sm group"
                        >
                        <span className="text-foreground/80 group-hover:text-foreground line-clamp-1">{template.title}</span>
                        <span className="text-xs text-primary ml-auto">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(template.price)}</span>
                        </li>
                    ))}
                    </ul>
                </>
            )}
             {searchTerm.length > 0 && filteredTemplates.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">No templates match "{searchTerm}".</p>
            )}
          </div>
        )}
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
