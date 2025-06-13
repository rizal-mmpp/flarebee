
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/'); // Redirect to home if not logged in
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Show a loading state or a minimal layout while checking auth/redirecting
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // If user is logged in, render the dashboard layout
  return (
    <div className="dark flex min-h-screen flex-col"> {/* Added className="dark" */}
      <Navbar /> 
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
