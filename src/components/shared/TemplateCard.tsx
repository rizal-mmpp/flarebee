import Image from 'next/image';
import Link from 'next/link';
import type { Template } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/templates/${template.id}`} className="block">
        <CardHeader className="p-0">
          <div className="aspect-[3/2] relative w-full">
            <Image
              src={template.imageUrl}
              alt={template.title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={template.dataAiHint || "template preview"}
            />
          </div>
        </CardHeader>
      </Link>
      <CardContent className="flex-grow p-4 md:p-6">
        <Link href={`/templates/${template.id}`} className="block">
          <CardTitle className="mb-2 text-lg font-semibold leading-tight hover:text-primary transition-colors">
            {template.title}
          </CardTitle>
        </Link>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary">{template.category.name}</Badge>
          {template.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 md:p-6 pt-0 flex justify-between items-center">
        <p className="text-xl font-bold text-primary">
          ${template.price}
        </p>
        <Button asChild variant="outline" size="sm" className="group transition-all duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground hover:border-accent">
          <Link href={`/templates/${template.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
