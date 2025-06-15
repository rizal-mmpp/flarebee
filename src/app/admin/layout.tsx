
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Loader2, PanelLeft } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { Hexagon } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <AdminSidebar onLinkClick={() => {}} />
      </aside>
      <div className="flex flex-1 flex-col sm:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              <AdminSidebar onLinkClick={() => setMobileSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
           <div className="sm:hidden">
            <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                <Hexagon className="h-7 w-7 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
                <span className="text-md font-bold text-foreground">RIO Admin</span>
            </Link>
           </div>
        </header>
        <main className="flex-grow p-4 md:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
         <footer className="border-t bg-background text-center py-4 px-6">
            <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Ragam Inovasi Optima Admin Panel.
            </p>
        </footer>
      </div>
    </div>
  );
}
