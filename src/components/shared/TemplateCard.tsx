
import Image from 'next/image';
import Link from 'next/link';
import type { Template } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TemplateCardProps {
  template: Template;
}

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-xl border-0 transition-all duration-300 ease-in-out">
      <Link href={`/templates/${template.id}`} className="block group flex-grow flex flex-col">
        <div className="aspect-[3/2] relative w-full overflow-hidden rounded-xl">
          <Image
            src={template.imageUrl}
            alt={template.title}
            fill
            style={{objectFit:"cover"}}
            className="transition-transform duration-300 ease-in-out group-hover:scale-105"
            data-ai-hint={template.dataAiHint || "template preview"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false} 
          />
        </div>
        <CardContent className="p-2"> 
          <div className="flex justify-between items-center gap-2">
            <CardTitle className="text-base font-semibold leading-tight hover:text-primary transition-colors truncate">
              {template.title}
            </CardTitle>
            <p className="text-lg font-bold text-accent flex-shrink-0">
              {formatIDR(template.price)}
            </p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

