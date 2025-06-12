
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-muted-foreground">
          <p>
            Welcome to RIO Templates! These terms and conditions outline the rules and regulations for the use of
            Ragam Inovasi Optima's Website, located at your website URL.
          </p>
          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use RIO
            Templates if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">License</h2>
          <p>
            Unless otherwise stated, Ragam Inovasi Optima (RIO) and/or its licensors own the intellectual property rights for all
            material on RIO Templates. All intellectual property rights are reserved. You may access this from
            RIO Templates for your own personal use subjected to restrictions set in these terms and conditions.
          </p>
          <p>You must not:</p>
          <ul>
            <li>Republish material from RIO Templates</li>
            <li>Sell, rent or sub-license material from RIO Templates</li>
            <li>Reproduce, duplicate or copy material from RIO Templates</li>
            <li>Redistribute content from RIO Templates</li>
          </ul>
          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">Disclaimer</h2>
          <p>
            To the maximum extent permitted by applicable law, we exclude all representations, warranties and
            conditions relating to our website and the use of this website. Nothing in this disclaimer will:
          </p>
          <ul>
            <li>limit or exclude our or your liability for death or personal injury;</li>
            <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
            <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
            <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
          </ul>
          <p>
            The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a)
            are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer,
            including liabilities arising in contract, in tort and for breach of statutory duty.
          </p>
          <p>
            As long as the website and the information and services on the website are provided free of charge, we
            will not be liable for any loss or damage of any nature.
          </p>
          <p className="mt-8">
            <em>This is a placeholder Terms of Service page. Please replace this with your actual terms for RIO.</em>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
