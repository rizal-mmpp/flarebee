
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LibraryBig, Lightbulb, Wrench, ChevronRight, FileText } from 'lucide-react';

const docSections = [
  {
    title: "Project Overview",
    description: "Understand the core concepts, goals, and architecture of RIO Templates.",
    href: "/admin/docs/project-overview",
    icon: FileText,
  },
  {
    title: "Business Model",
    description: "Explore the potential business strategies: freemium, shop, or a hybrid approach.",
    href: "/admin/docs/business-model",
    icon: Lightbulb,
  },
  {
    title: "Developer Guide",
    description: "Technical documentation for developers: setup, stack, conventions, and contribution guidelines.",
    href: "/admin/docs/developer-guide",
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
          Explore various aspects of the RIO Templates project.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docSections.map((section) => (
          <Card key={section.href} className="flex flex-col transition-all duration-300 hover:border-primary/70 hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <section.icon className="h-7 w-7 text-primary" />
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </div>
              <CardDescription className="text-sm min-h-[40px]">{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <Button variant="outline" asChild className="w-full group">
                <Link href={section.href}>
                  Read More
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
