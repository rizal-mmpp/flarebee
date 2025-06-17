
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wrench } from 'lucide-react';

export default function DeveloperGuidePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Wrench className="mr-3 h-8 w-8 text-primary" />
          Developer Guide
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
          <CardTitle>Technical Documentation for RIO Templates</CardTitle>
          <CardDescription>Information for developers working on or contributing to the platform.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>Project Setup</h2>
          <p>
            To set up the project locally, ensure you have Node.js (version recommended in <code>.nvmrc</code> or latest LTS) and pnpm/npm/yarn installed.
          </p>
          <ol>
            <li>Clone the repository.</li>
            <li>Install dependencies: <code>pnpm install</code> (or equivalent).</li>
            <li>Set up Firebase:
              <ul>
                <li>Create a Firebase project at <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">console.firebase.google.com</a>.</li>
                <li>Enable Firestore and Authentication (Email/Password and Google Sign-In).</li>
                <li>Obtain your Firebase project configuration and add it to <code>.env.local</code> (copy from <code>.env.example</code>).</li>
                <li>Update <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> in <code>.env.local</code>.</li>
              </ul>
            </li>
            <li>Set up Xendit:
              <ul>
                <li>Create a Xendit account and obtain your secret API key.</li>
                <li>Add <code>XENDIT_SECRET_KEY</code> and <code>XENDIT_CALLBACK_VERIFICATION_TOKEN</code> to <code>.env.local</code>.</li>
              </ul>
            </li>
             <li>Set up Vercel Blob Storage:
              <ul>
                <li>Create a Vercel Blob store and obtain your read/write token.</li>
                <li>Add <code>BLOB_READ_WRITE_TOKEN</code> to <code>.env.local</code>.</li>
              </ul>
            </li>
            <li>Run the development server: <code>pnpm dev</code>.</li>
          </ol>

          <h2>Tech Stack</h2>
          <ul>
            <li><strong>Framework:</strong> Next.js (App Router)</li>
            <li><strong>Language:</strong> TypeScript</li>
            <li><strong>UI Components:</strong> React, ShadCN UI</li>
            <li><strong>Styling:</strong> Tailwind CSS</li>
            <li><strong>Authentication:</strong> Firebase Authentication</li>
            <li><strong>Database:</strong> Firestore</li>
            <li><strong>Payments:</strong> Xendit Node SDK</li>
            <li><strong>AI Tools:</strong> Genkit (Example for AI Template Tagging - Not fully implemented yet)</li>
            <li><strong>File Storage:</strong> Vercel Blob</li>
          </ul>

          <h2>Key Directories</h2>
          <ul>
            <li><code>src/app</code>: Next.js App Router pages and layouts.
                <ul>
                    <li><code>(auth)</code>: Authentication related pages.</li>
                    <li><code>(main)</code>: Main public facing application pages.</li>
                    <li><code>admin</code>: Admin panel routes.</li>
                    <li><code>api</code>: API routes (e.g., webhooks).</li>
                </ul>
            </li>
            <li><code>src/components</code>: Reusable UI components.
                <ul>
                    <li><code>admin</code>: Components specific to the admin panel.</li>
                    <li><code>layout</code>: Navbar, Footer.</li>
                    <li><code>sections</code>: Larger page sections (e.g., template grid).</li>
                    <li><code>shared</code>: Generic shared components.</li>
                    <li><code>ui</code>: ShadCN UI primitives and customized components.</li>
                </ul>
            </li>
            <li><code>src/lib</code>: Core logic, utilities, Firebase setup, server actions.
                <ul>
                    <li><code>actions</code>: Next.js Server Actions.</li>
                    <li><code>firebase</code>: Firebase configuration, AuthContext, Firestore helpers.</li>
                </ul>
            </li>
            <li><code>src/context</code>: React Context providers (e.g., CartContext).</li>
            <li><code>src/hooks</code>: Custom React hooks.</li>
          </ul>
          
          <h2>Coding Conventions</h2>
          <ul>
            <li>Follow Next.js App Router best practices (Server Components by default, Server Actions).</li>
            <li>Use TypeScript for type safety.</li>
            <li>Prefer ShadCN UI components and Tailwind CSS for styling.</li>
            <li>Keep components small and focused.</li>
            <li>Ensure responsive design (mobile-first).</li>
            <li>Write clear and concise code. No comments in JSON files or `package.json`.</li>
          </ul>

          <h2>Contributing (Placeholder)</h2>
          <p>
            Details on how to contribute to the project will be added here (e.g., branching strategy, PR process).
          </p>

           <h2>Important Notes for Admin Panel Development</h2>
          <ul>
            <li>The admin panel uses Firestore for data storage (templates, users, orders).</li>
            <li>Server Actions in <code>src/lib/actions</code> handle CUD operations for templates and other admin tasks.</li>
            <li>Authentication uses Firebase Auth, and user roles ('admin', 'user') are stored in the Firestore 'users' collection.</li>
            <li>Ensure paths in `<change><file>` tags are absolute when modifying files.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
