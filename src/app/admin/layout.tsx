
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { Loader2, PanelLeft, Search } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { Hexagon } from 'lucide-react';
import NextImage from 'next/image';
import { getSiteSettings } from '@/lib/actions/settings.actions';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { SiteSettings } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, signOut, authMethod, loading: authLoading } = useCombinedAuth();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/'); 
      } else if (user.role !== 'admin') {
        router.replace('/'); 
      }
    }
  }, [user, authLoading, router]);

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
    if (user && user.role === 'admin') { 
        loadSettings();
    } else if (!authLoading && (!user || user.role !== 'admin')) {
        setSiteSettings(DEFAULT_SETTINGS);
        setSettingsLoading(false);
    }
  }, [user, authLoading]);


  if (authLoading || settingsLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access & loading settings...</p>
      </div>
    );
  }
  
  const displaySiteTitleForLogo = siteSettings?.siteTitle || DEFAULT_SETTINGS.siteTitle;
  const displayLogoUrl = siteSettings?.logoUrl;
  
  const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return "U";
    const initials = displayName.split(' ').map(name => name[0]).join('').toUpperCase();
    return initials || "U";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col bg-sidebar text-sidebar-foreground sm:flex">
        <AdminSidebar 
          onLinkClick={() => {}} 
          logoUrl={displayLogoUrl} 
          siteTitle={displaySiteTitleForLogo} 
        />
      </aside>
      <div className="flex flex-1 flex-col sm:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
           <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden flex-shrink-0">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs p-0 w-[80vw]">
                <SheetHeader className="sr-only"><SheetTitle>Admin Menu</SheetTitle></SheetHeader>
                <AdminSidebar 
                  onLinkClick={() => setMobileSidebarOpen(false)}
                  logoUrl={displayLogoUrl}
                  siteTitle={displaySiteTitleForLogo} 
                />
              </SheetContent>
            </Sheet>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="w-full md:w-[300px] lg:w-[400px] pl-9 bg-muted" />
            </div>

             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Admin'} />
                    <AvatarFallback>{getAvatarFallback(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Admin'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard">User Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/settings">My Account</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </header>

        <main className="flex-grow p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
