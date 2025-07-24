
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Category, ServiceCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ListFilter } from 'lucide-react';

interface CategoryFilterProps {
  categories: (Category | ServiceCategory)[];
  selectedCategory: string | null;
}

export function CategoryFilter({
  categories,
  selectedCategory,
}: CategoryFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    return params.toString();
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <ListFilter className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">Filter by Category</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          variant={selectedCategory === null ? 'default' : 'outline'}
          className={cn(
            "transition-all duration-200 ease-in-out",
            selectedCategory === null ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground hover:border-accent"
          )}
        >
          <Link href={`${pathname}?${createQueryString('category', '')}`}>All</Link>
        </Button>
        {categories.map((category) => (
          <Button
            asChild
            key={category.id}
            variant={selectedCategory === category.slug ? 'default' : 'outline'}
            className={cn(
              "transition-all duration-200 ease-in-out",
              selectedCategory === category.slug ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground hover:border-accent"
            )}
          >
            <Link href={`${pathname}?${createQueryString('category', category.slug)}`}>{category.name}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
