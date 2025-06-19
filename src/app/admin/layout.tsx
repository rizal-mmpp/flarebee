
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Loader2, PanelLeft } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'; // Added SheetHeader, SheetTitle
import Link from 'next/link';
import { Hexagon } from 'lucide-react';
import NextImage from 'next/image';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { SiteSettings } from '@/lib/types';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/'); 
      } else if (role !== 'admin') {
        router.replace('/'); 
      }
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function loadSettings() {
      setSettingsLoading(true);
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error("AdminLayout: Failed to fetch site settings, using defaults:", error);
        setSiteSettings(DEFAULT_SETTINGS);
      } finally {
        setSettingsLoading(false);
      }
    }
    if (user && role === 'admin') { // Fetch settings only if admin is confirmed
        loadSettings();
    } else if (!authLoading && (!user || role !== 'admin')) {
        // If not admin or not logged in, and auth check is done, still use default settings to avoid null
        setSiteSettings(DEFAULT_SETTINGS);
        setSettingsLoading(false);
    }
  }, [user, role, authLoading]);


  if (authLoading || settingsLoading || !user || role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access & loading settings...</p>
      </div>
    );
  }
  
  const displaySiteTitle = siteSettings?.siteTitle || DEFAULT_SETTINGS.siteTitle;
  const displayLogoUrl = siteSettings?.logoUrl;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <AdminSidebar 
          onLinkClick={() => {}} 
          logoUrl={displayLogoUrl} 
          siteTitle={displaySiteTitle}
        />
      </aside>
      <div className="flex flex-1 flex-col sm:pl-64">
        <div className="sm:hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs p-0">
                {/* Ensuring SheetContent has an accessible title for mobile admin sidebar */}
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation Menu</SheetTitle>
                </SheetHeader>
                <AdminSidebar 
                  onLinkClick={() => setMobileSidebarOpen(false)}
                  logoUrl={displayLogoUrl}
                  siteTitle={displaySiteTitle}
                />
              </SheetContent>
            </Sheet>
            <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                {displayLogoUrl ? (
                  <NextImage src={displayLogoUrl} alt={`${displaySiteTitle} Admin Logo`} width={28} height={28} className="h-7 w-7 object-contain" />
                ) : (
                  <Hexagon className="h-7 w-7 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
                )}
                <span className="text-md font-bold text-foreground">{displaySiteTitle} Admin</span>
            </Link>
          </header>
        </div>
        <main className="flex-grow p-4 md:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
         <footer className="border-t bg-background text-center py-4 px-6">
            <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} {displaySiteTitle} Admin Panel.
            </p>
        </footer>
      </div>
    </div>
  );
}
