
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lightbulb } from 'lucide-react';

export default function BusinessModelPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Lightbulb className="mr-3 h-8 w-8 text-primary" />
          Business Model
        </h1>
        <Button variant="outline" asChild className="w-full sm:w-auto group">
          <Link href="/admin/docs">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Documentation
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monetization Strategies for RIO Templates</CardTitle>
          <CardDescription>Exploring potential business models for the platform.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            The RIO Templates platform is currently set up as a digital marketplace where users purchase
            templates. However, various business models or combinations can be considered.
          </p>

          <h2>1. Direct Sales (Current Model - Shop)</h2>
          <p>
            This is the implemented model. Templates are listed with a price, and users purchase them
            individually.
          </p>
          <ul>
            <li><strong>Pros:</strong> Straightforward revenue per transaction, clear value proposition.</li>
            <li><strong>Cons:</strong> Revenue depends on continuous new sales, may have higher barrier to entry for some users.</li>
          </ul>

          <h2>2. Freemium Model</h2>
          <p>
            Offer a selection of basic templates for free, with more advanced or feature-rich templates
            available as premium purchases.
          </p>
          <ul>
            <li><strong>Pros:</strong> Attracts a larger user base, free templates act as a lead magnet, potential for upsells.</li>
            <li><strong>Cons:</strong> Requires balancing free vs. paid features, conversion rate from free to paid is critical.</li>
          </ul>

          <h2>3. Subscription Model</h2>
          <p>
            Users pay a recurring fee (monthly or annually) to access all templates or a specific tier of templates.
          </p>
          <ul>
            <li><strong>Pros:</strong> Predictable recurring revenue, fosters user loyalty.</li>
            <li><strong>Cons:</strong> Requires a consistently growing library of valuable templates to justify subscription, higher churn risk if value isn't maintained.</li>
          </ul>
          
          <h2>4. Hybrid Approach</h2>
          <p>
            Combine elements of the above models. For example:
          </p>
          <ul>
            <li>Offer some free templates (Freemium).</li>
            <li>Sell individual premium templates (Shop).</li>
            <li>Optionally, offer a "Pro" subscription for access to all premium templates and perhaps early access to new ones or other benefits.</li>
          </ul>
          <p>
            This could provide multiple revenue streams and cater to different user needs and budgets.
          </p>

          <h2>Considerations for RIO Templates</h2>
          <p>
            The current infrastructure primarily supports the <strong>Direct Sales</strong> model.
            Implementing Freemium would involve marking certain templates as free (price = 0) and adjusting the UI.
            A Subscription model would require significant additional development for recurring payments, user access management based on subscription status, etc.
          </p>
          <p>
            For now, focusing on enhancing the Direct Sales model by adding more high-quality templates and improving the user experience is the most straightforward path.
            A Freemium aspect (a few free "taster" templates) could be a relatively low-effort addition to attract more users.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
