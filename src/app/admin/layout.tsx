
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/'); // Redirect to home if not logged in
      } else if (role !== 'admin') {
        router.replace('/'); // Redirect to home if not an admin
      }
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== 'admin') {
    // Show a loading state or a minimal layout while checking auth/redirecting
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  // If user is admin, render the admin layout
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
