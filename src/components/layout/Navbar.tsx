
'use client';
import Link from 'next/link';
import { Hexagon, LogIn, LogOut, UserCircle, ShieldCheck, LayoutDashboard, LayoutGrid, ShoppingCart, ChevronDown, Compass, Settings } from 'lucide-react'; // Added Settings
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useCart } from '@/context/CartContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CustomMenuIcon } from '@/components/shared/CustomMenuIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getSiteSettings } from '@/lib/actions/settings.actions'; 
import { DEFAULT_SETTINGS } from '@/lib/constants'; // Updated import
import type { SiteSettings } from '@/lib/types';
import NextImage from 'next/image'; // Use NextImage for optimization

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, signOutUser, loading } = useAuth();
  const { cartItems } = useCart();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error("Failed to fetch site settings for navbar:", error);
        setSiteSettings(DEFAULT_SETTINGS); // Fallback to defaults
      }
    }
    fetchSettings();
  }, []);


  const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return <UserCircle className="h-6 w-6" />;
    const initials = displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    return initials || <UserCircle className="h-6 w-6" />;
  };

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const mobileMenuMainItemClass = "flex items-center rounded-md p-2 text-base font-bold text-card-foreground transition-colors hover:bg-muted w-full";
  const mobileMenuAccordionTriggerClass = cn(mobileMenuMainItemClass, "justify-between hover:no-underline");
  const mobileMenuAccordionContentLinkClass = cn(mobileMenuMainItemClass, "font-normal text-sm hover:bg-muted/80");


  const desktopMenuItemClass = "text-sm text-foreground/80 transition-colors hover:text-foreground hover:font-medium";
  const desktopDropdownItemClass = "cursor-pointer text-sm";

  const siteTitle = siteSettings?.siteTitle || DEFAULT_SETTINGS.siteTitle;
  const logoUrl = siteSettings?.logoUrl;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group mr-2 sm:mr-6 overflow-hidden">
          {logoUrl ? (
            <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={32} height={32} className="h-8 w-8 object-contain flex-shrink-0" />
          ) : (
            <Hexagon className="h-8 w-8 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg] flex-shrink-0" />
          )}
          <span className="text-sm sm:text-base font-bold text-foreground whitespace-nowrap">{siteTitle}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(desktopMenuItemClass, "flex items-center gap-1 outline-none")}>
              Explore <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem asChild className={desktopDropdownItemClass}>
                <Link href="/">All Templates</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {CATEGORIES.map((category) => (
                <DropdownMenuItem key={category.id} asChild className={desktopDropdownItemClass}>
                  <Link href={`/?category=${category.slug}`}>{category.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <Link
              href="/dashboard"
              className={desktopMenuItemClass}
            >
              Dashboard
            </Link>
          )}

          {user && role === 'admin' && (
             <Link
              href="/admin/dashboard"
              className={desktopMenuItemClass}
            >
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 pl-4">
          {user && (
            <Button variant="ghost" size="icon" asChild className="relative hidden md:inline-flex">
              <Link href="/checkout">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                    {cartItemCount}
                  </Badge>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Link>
            </Button>
          )}

          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-muted"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{getAvatarFallback(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {role && (
                        <p className="text-xs leading-none text-muted-foreground flex items-center pt-1">
                          <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
                          Role: <span className="font-medium capitalize text-foreground/90 ml-1">{role}</span>
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   {role === 'admin' && (
                     <DropdownMenuItem asChild className={desktopDropdownItemClass}>
                        <Link href="/admin/settings">
                          <Settings className="mr-2 h-4 w-4" /> Site Settings
                        </Link>
                      </DropdownMenuItem>
                   )}
                  <DropdownMenuItem onClick={signOutUser} className={cn(desktopDropdownItemClass, "text-destructive focus:text-destructive")}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" asChild className="group">
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                  Sign In / Sign Up
                </Link>
              </Button>
            )}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Toggle menu" className="h-9 w-9">
                 <CustomMenuIcon isOpen={mobileMenuOpen} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] bg-card p-0 flex flex-col">
              <SheetHeader className="p-6 pb-4 border-b border-border">
                <SheetTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
                  {logoUrl ? (
                     <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={28} height={28} className="h-7 w-7 object-contain" />
                  ) : (
                     <Hexagon className="h-7 w-7 text-primary" />
                  )}
                   <span>{siteTitle}</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-grow overflow-y-auto p-6 space-y-2 flex flex-col">
                {user && (
                  <div className="mb-4"> 
                    <div className="flex items-center gap-3 mb-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback className="text-lg">{getAvatarFallback(user.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-tight text-card-foreground">{user.displayName || 'User'}</p>
                        <p className="text-xs leading-tight text-muted-foreground">{user.email}</p>
                         {role && (
                          <p className="text-xs leading-tight text-muted-foreground flex items-center pt-0.5">
                            <ShieldCheck className="mr-1 h-3 w-3 text-primary" />
                            <span className="font-medium capitalize text-card-foreground/80">{role}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {user && (
                  <Link
                      href="/checkout"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(mobileMenuMainItemClass, "relative")}
                  >
                      <ShoppingCart className="mr-2 h-5 w-5" /> <span>Cart</span>
                      {cartItemCount > 0 && (
                          <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                          {cartItemCount}
                          </Badge>
                      )}
                  </Link>
                )}

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="explore-categories" className="border-b-0">
                    <AccordionTrigger className={mobileMenuAccordionTriggerClass}>
                      <div className="flex items-center">
                        <Compass className="mr-2 h-5 w-5" />
                        Explore
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-4 pt-1 pb-0 space-y-1">
                       <Link
                        href={`/`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={mobileMenuAccordionContentLinkClass}
                      >
                        All Templates
                      </Link>
                      {CATEGORIES.map((category) => (
                        <Link
                          key={category.id}
                          href={`/?category=${category.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={mobileMenuAccordionContentLinkClass}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                {user && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileMenuMainItemClass}
                  >
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {user && role === 'admin' && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileMenuMainItemClass}
                    >
                       <LayoutGrid className="mr-2 h-5 w-5" /> <span>Admin Panel</span>
                    </Link>
                     <Link
                      href="/admin/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileMenuMainItemClass}
                    >
                       <Settings className="mr-2 h-5 w-5" /> <span>Site Settings</span>
                    </Link>
                  </>
                )}
                
                <div className="mt-auto pt-4 border-t border-border"> 
                  {loading ? (
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                  ) : user ? (
                    <Button 
                      variant="outline" 
                      onClick={() => { signOutUser(); setMobileMenuOpen(false); }} 
                      className="w-full group text-destructive border-destructive/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button variant="default" asChild className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In / Sign Up
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
