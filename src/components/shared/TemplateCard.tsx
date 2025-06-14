
import Image from 'next/image';
import Link from 'next/link';
import type { Template } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react'; // Kept in case of future re-additions, but not used now

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
    <Card className="flex flex-col overflow-hidden rounded-xl transition-all duration-300 ease-in-out hover:border-primary/50">
      <Link href={`/templates/${template.id}`} className="block group flex-grow flex flex-col">
        <CardHeader className="p-0">
          <div className="aspect-[3/2] relative w-full overflow-hidden rounded-t-xl">
            <Image
              src={template.imageUrl}
              alt={template.title}
              fill
              style={{objectFit:"cover"}}
              className="transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={template.dataAiHint || "template preview"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 flex-grow">
          <CardTitle className="mb-1 text-lg font-semibold leading-tight hover:text-primary transition-colors">
            {template.title}
          </CardTitle>
        </CardContent>
        <CardFooter className="p-4 md:p-6 pt-0">
          <p className="text-xl font-bold text-primary">
            {formatIDR(template.price)}
          </p>
        </CardFooter>
      </Link>
    </Card>
  );
}
