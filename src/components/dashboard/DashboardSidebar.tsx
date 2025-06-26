
'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  LogOut,
  Home,
  UserCircle,
  Package,
  CreditCard,
  Puzzle,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';

interface DashboardSidebarProps {
  onLinkClick?: () => void; 
  logoUrl?: string | null;
  siteTitle?: string | null;
}

const accountNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingCart },
  { href: '/dashboard/services', label: 'My Services', icon: Package },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Puzzle },
  { href: '/dashboard/settings', label: 'Account Settings', icon: Settings },
];

const exploreNavItems = [
  { href: '/services', label: 'Browse Store', icon: Compass },
  { href: '/', label: 'Back to Homepage', icon: Home },
];


export function DashboardSidebar({ onLinkClick, logoUrl, siteTitle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();

  const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return <UserCircle className="h-6 w-6" />;
    const initials = displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    return initials || <UserCircle className="h-6 w-6" />;
  };

  const navLinkClasses = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary';
  const activeNavLinkClasses = 'bg-muted text-primary font-semibold';

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground group" onClick={onLinkClick}>
           {logoUrl ? (
            <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={28} height={28} className="h-7 w-7 object-contain" />
          ) : null }
          <span className="text-lg">{siteTitle}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-1 text-lg font-semibold tracking-tight">Account</h2>
            {accountNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(navLinkClasses, (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) && activeNavLinkClasses)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>

          <Separator className="my-2" />

          <div className="px-3 py-2">
             <h2 className="mb-2 px-1 text-lg font-semibold tracking-tight">Explore</h2>
             {exploreNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(navLinkClasses)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
         <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                <AvatarFallback>{getAvatarFallback(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="text-sm font-semibold leading-tight text-foreground">{user?.displayName || 'User'}</p>
                <p className="text-xs leading-tight text-muted-foreground">{user?.email}</p>
            </div>
        </div>
        <Button variant="ghost" onClick={signOutUser} className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
