'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useCombinedAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
