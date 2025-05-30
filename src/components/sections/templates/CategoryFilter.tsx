'use client';

import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ListFilter } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <ListFilter className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">Filter by Category</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          onClick={() => onSelectCategory(null)}
          className={cn(
            "transition-all duration-200 ease-in-out",
            selectedCategory === null ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground hover:border-accent"
          )}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? 'default' : 'outline'}
            onClick={() => onSelectCategory(category.slug)}
            className={cn(
              "transition-all duration-200 ease-in-out",
              selectedCategory === category.slug ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground hover:border-accent"
            )}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
