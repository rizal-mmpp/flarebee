
'use client';
import Link from 'next/link';
import { Hexagon, LogIn, LogOut, Menu, UserCircle, X, LayoutDashboard, ShieldCheck, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const baseNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/templates', label: 'Explore' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, signInWithGoogle, signOutUser, loading } = useAuth();

  const navLinks = [...baseNavLinks];
  if (user) {
    navLinks.push({ href: '/dashboard', label: 'Dashboard' });
  }
  if (user && role === 'admin') {
    navLinks.push({ href: '/admin/dashboard', label: 'Admin Panel' });
  }


  const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return <UserCircle className="h-6 w-6" />;
    const initials = displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    return initials || <UserCircle className="h-6 w-6" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Hexagon className="h-8 w-8 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
          <span className="text-xl font-bold text-foreground">Flarebee</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/80 transition-colors hover:text-foreground hover:font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
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
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="w-full">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                {role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="w-full">
                       <LayoutGrid className="mr-2 h-4 w-4" /> 
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOutUser}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={signInWithGoogle} className="group">
              <LogIn className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
              Login with Google
            </Button>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-6">
              <Link href="/" className="flex items-center gap-2 mb-8" onClick={() => setMobileMenuOpen(false)}>
                <Hexagon className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Flarebee</span>
              </Link>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
