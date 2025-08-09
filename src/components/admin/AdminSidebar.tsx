
'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  Hexagon,
  TestTube2,
  Archive,
  LibraryBig,
  Briefcase,
  DatabaseZap,
  Repeat,
  Package,
  Mail,
  ChevronDown,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminSidebarProps {
  onLinkClick?: () => void;
  logoUrl?: string | null;
  siteTitle?: string | null;
}

const navGroups = [
  {
    title: 'Core',
    items: [
      { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/projects', label: 'Projects', icon: Package },
      { href: '/admin/services', label: 'Services', icon: Briefcase },
      { href: '/admin/subscription-plans', label: 'Subscription Plans', icon: Repeat },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/pages', label: 'Pages', icon: FileText },
      { href: '/admin/assets', label: 'Assets', icon: Archive },
      { href: '/admin/docs', label: 'Documentation', icon: LibraryBig },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/migration', label: 'Data Migration', icon: DatabaseZap },
    ],
  },
   {
    title: 'Testing',
    items: [
      { href: '/admin/email-test', label: 'Email Test', icon: Mail },
      { href: '/admin/xendit-test', label: 'Xendit Tests', icon: TestTube2 },
    ],
  },
];

export function AdminSidebar({ onLinkClick, logoUrl, siteTitle }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useCombinedAuth();

  const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return <UserCircle className="h-6 w-6" />;
    const initials = displayName.split(' ').map(name => name[0]).join('').toUpperCase();
    return initials || <UserCircle className="h-6 w-6" />;
  };

  const isGroupActive = (items: any[]) => items.some(item => pathname.startsWith(item.href));

  return (
    <div className="flex h-full max-h-screen flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold group text-sidebar-foreground" onClick={onLinkClick}>
          {logoUrl ? (
            <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={32} height={32} className="h-8 w-8 object-contain" />
          ) : (
            <Hexagon className="h-8 w-8 text-sidebar-foreground transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
          )}
          <span className="text-lg">Admin Panel</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          className="w-full px-2 lg:px-4 space-y-1"
          defaultValue={navGroups.filter(group => isGroupActive(group.items)).map(group => group.title)}
        >
          {navGroups.map((group) => (
            <AccordionItem value={group.title} key={group.title} className="border-b-0">
              <AccordionTrigger className="py-2 text-sm font-semibold uppercase text-sidebar-muted-foreground hover:text-sidebar-foreground hover:no-underline [&[data-state=open]>svg]:text-sidebar-foreground">
                {group.title}
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <nav className="grid items-start text-sm font-medium gap-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onLinkClick}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))) &&
                          'bg-sidebar-active text-sidebar-active-foreground font-semibold'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

       <div className="mt-auto p-4 border-t border-sidebar-border">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start items-center h-auto p-0 gap-3 hover:bg-sidebar-accent">
                     <Avatar className="h-10 w-10 border-2 border-sidebar-accent">
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                        <AvatarFallback className="bg-sidebar-muted">{getAvatarFallback(user?.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left overflow-hidden">
                        <p className="text-sm font-semibold leading-tight text-sidebar-foreground truncate">{user?.displayName || 'User'}</p>
                        <p className="text-xs leading-tight text-sidebar-muted-foreground truncate">{user?.email}</p>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                 <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>My Account</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
