
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LibraryBig, Lightbulb, Wrench, Eye, Edit as EditIcon, Info } from 'lucide-react';

const docSections = [
  {
    id: "about-rio", // Added ID for dynamic route
    title: "About RIO",
    description: "Understand the vision, mission, services, and core concepts of Ragam Inovasi Optima.",
    viewHref: "/admin/docs/view/about-rio", // Changed from publicHref
    editHref: "/admin/pages/edit/about-rio",
    icon: Info,
  },
  {
    id: "business-model", // Added ID
    title: "Business Model",
    description: "Explore the potential business strategies and service models for RIO.",
    viewHref: "/admin/docs/view/business-model", // Changed
    editHref: "/admin/pages/edit/business-model",
    icon: Lightbulb,
  },
  {
    id: "developer-guide", // Added ID
    title: "Developer Guide",
    description: "Technical documentation for developers: setup, stack, conventions, and contribution guidelines.",
    viewHref: "/admin/docs/view/developer-guide", // Changed
    editHref: "/admin/pages/edit/developer-guide",
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
          View and manage documentation for the RIO project. Content is editable via the Site Pages menu.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docSections.map((section) => (
          <Card key={section.id} className="flex flex-col transition-all duration-300 hover:border-primary/70 hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <section.icon className="h-7 w-7 text-primary" />
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </div>
              <CardDescription className="text-sm min-h-[60px]">{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-0 flex flex-col md:flex-row gap-2">
              <Button variant="outline" asChild className="w-full group">
                <Link href={section.viewHref}>
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
