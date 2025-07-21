
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { Loader2, PanelLeft } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { SiteSettings } from '@/lib/types';
import NextImage from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, user, authMethod, loading } = useCombinedAuth();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    console.log('[DashboardLayout] Auth Method:', authMethod, '| User State:', user);
  }, [user, authMethod]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, router]);
  
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error("DashboardLayout: Failed to fetch site settings, using defaults:", error);
        setSiteSettings(DEFAULT_SETTINGS);
      }
    }
    loadSettings();
  }, []);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  const siteTitle = siteSettings?.siteTitle || DEFAULT_SETTINGS.siteTitle;
  const logoUrl = siteSettings?.logoUrl;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-72 flex-col border-r bg-background sm:flex">
        <DashboardSidebar 
            onLinkClick={() => {}} 
            logoUrl={logoUrl}
            siteTitle={siteTitle}
        />
      </aside>
      <div className="flex flex-1 flex-col sm:pl-72">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs p-0 w-[90vw]">
                <SheetHeader className="sr-only"><SheetTitle>Dashboard Navigation Menu</SheetTitle></SheetHeader>
                <DashboardSidebar 
                    onLinkClick={() => setMobileSidebarOpen(false)}
                    logoUrl={logoUrl}
                    siteTitle={siteTitle}
                />
              </SheetContent>
            </Sheet>
             <div className="flex items-center gap-2 sm:hidden">
                {logoUrl ? (
                  <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={28} height={28} className="h-7 w-7 object-contain" />
                ) : null}
                <span className="text-md font-bold text-foreground">{siteTitle}</span>
            </div>
        </header>
        <main className="flex-grow bg-muted/40">
          {children}
        </main>
         <footer className="border-t bg-background text-center py-4 px-6">
            <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
            </p>
        </footer>
      </div>
    </div>
  );
}
