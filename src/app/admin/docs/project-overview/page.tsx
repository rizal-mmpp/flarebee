
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';

export default function ProjectOverviewPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <FileText className="mr-3 h-8 w-8 text-primary" />
          Project Overview
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
          <CardTitle>Understanding RIO Templates</CardTitle>
          <CardDescription>Core concepts, goals, and architecture of the RIO Templates project.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>Introduction</h2>
          <p>
            RIO Templates is a platform designed to provide high-quality, modern application templates
            built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit for AI features.
            The primary goal is to accelerate the development process for users by offering
            production-ready starting points for various application types.
          </p>

          <h2>Core Features (from PRD)</h2>
          <ul>
            <li>Template Showcase & Browsing</li>
            <li>Detailed Template Pages</li>
            <li>Secure Payment Processing (Xendit)</li>
            <li>Instant Access & Email Delivery</li>
            <li>Admin Template Management</li>
            <li>AI-Powered Tagging & Descriptions</li>
          </ul>

          <h2>Target Audience</h2>
          <p>
            This platform targets developers, startups, and agencies looking for a quick way to
            launch new projects with a modern tech stack and appealing UI.
          </p>
          
          <h2>Tech Stack Overview</h2>
          <ul>
            <li><strong>Frontend:</strong> Next.js (App Router), React, TypeScript</li>
            <li><strong>UI:</strong> ShadCN UI Components, Tailwind CSS</li>
            <li><strong>AI Integration:</strong> Genkit (for features like AI template tagging)</li>
            <li><strong>Backend/Database:</strong> Firebase (Firestore for data, Firebase Auth for authentication)</li>
            <li><strong>Payments:</strong> Xendit</li>
            <li><strong>Deployment:</strong> Vercel</li>
          </ul>

          <h2>Architectural Goals</h2>
          <ul>
            <li><strong>Modularity:</strong> Components and features designed for reusability.</li>
            <li><strong>Scalability:</strong> Leveraging serverless architecture with Vercel and Firebase.</li>
            <li><strong>Maintainability:</strong> Clean code, TypeScript, and clear project structure.</li>
            <li><strong>Developer Experience:</strong> Easy setup and intuitive admin panel.</li>
          </ul>
          
          <p className="mt-6 text-sm text-muted-foreground">
            <em>This page provides a high-level overview. For more detailed technical information, please refer to the Developer Guide.</em>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
