
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

const formatIDR = (amount?: number) => {
  if (amount === undefined) return null;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ServiceCard({ service }: ServiceCardProps) {
  const displayPrice = service.pricingModel === 'Fixed Price' || service.pricingModel === 'Starting At' 
    ? formatIDR(service.priceMin)
    : service.pricingModel;

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 group">
      <Link href={`/services/${service.id}`} className="flex-grow flex flex-col">
        <div className="aspect-[16/9] relative w-full overflow-hidden">
          <Image
            src={service.imageUrl}
            alt={service.title}
            fill
            style={{objectFit:"cover"}}
            className="transition-transform duration-300 ease-in-out group-hover:scale-105"
            data-ai-hint={service.dataAiHint || "service abstract"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false} 
          />
        </div>
        <CardHeader>
            <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {service.title}
                </CardTitle>
                {displayPrice && <Badge variant="secondary">{displayPrice}</Badge>}
            </div>
            <CardDescription className="line-clamp-3 pt-1">{service.shortDescription}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="text-sm font-semibold text-primary group-hover:text-foreground flex items-center">
            Learn More <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
