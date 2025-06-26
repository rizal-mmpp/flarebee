
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
        <Card className="text-center py-8 px-6 w-full max-w-lg">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit mb-4">
                    <SearchX className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="text-4xl font-bold text-destructive">404 - Not Found</CardTitle>
                <CardDescription className="text-lg">
                    Oops! The page you are looking for does not exist.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">
                    It might have been moved, deleted, or you might have mistyped the URL. Let's get you back on track.
                </p>
                <Button asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Dashboard
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
