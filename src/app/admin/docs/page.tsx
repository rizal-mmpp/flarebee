
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LibraryBig, Lightbulb, Wrench, Eye, Edit as EditIcon, Info } from 'lucide-react'; // Added Eye, EditIcon, Info

const docSections = [
  {
    title: "About RIO",
    description: "Understand the vision, mission, services, and core concepts of Ragam Inovasi Optima.",
    editHref: "/admin/pages/edit/about-rio",
    publicHref: "/about-rio",
    icon: Info,
  },
  {
    title: "Business Model",
    description: "Explore the potential business strategies: freemium, shop, or a hybrid approach.",
    editHref: "/admin/pages/edit/business-model",
    publicHref: "/business-model",
    icon: Lightbulb,
  },
  {
    title: "Developer Guide",
    description: "Technical documentation for developers: setup, stack, conventions, and contribution guidelines.",
    editHref: "/admin/pages/edit/developer-guide",
    publicHref: "/developer-guide",
    icon: Wrench,
  },
];

export default function AdminDocsPage() {
  return (
    <div className="space-y-8">
      <header className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <LibraryBig className="mr-3 h-8 w-8 text-primary" />
          Project Documentation
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage documentation for the RIO Templates project.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docSections.map((section) => (
          <Card key={section.editHref} className="flex flex-col transition-all duration-300 hover:border-primary/70 hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <section.icon className="h-7 w-7 text-primary" />
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </div>
              <CardDescription className="text-sm min-h-[60px]">{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-0 flex flex-col md:flex-row gap-2">
              <Button variant="outline" asChild className="w-full group">
                <Link href={section.publicHref} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" /> View
                </Link>
              </Button>
               <Button variant="default" asChild className="w-full group bg-primary/80 hover:bg-primary/90">
                <Link href={section.editHref}>
                  <EditIcon className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
