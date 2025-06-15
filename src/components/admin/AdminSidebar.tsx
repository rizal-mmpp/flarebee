
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LayoutGrid,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  Hexagon,
  CreditCard,
  TestTube2, // For Xendit Tests
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  onLinkClick?: () => void; // Optional: for closing mobile sidebar
}

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/templates', label: 'Templates', icon: LayoutGrid },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/pages', label: 'Site Pages', icon: FileText },
  { href: '/admin/xendit-test', label: 'Xendit Tests', icon: TestTube2 },
  // { href: '/admin/settings', label: 'Settings', icon: Settings }, // Placeholder
];

export function AdminSidebar({ onLinkClick }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-background">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold group" onClick={onLinkClick}>
          <Hexagon className="h-7 w-7 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
          <span className="text-lg">RIO Admin</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))) && 'bg-muted text-primary font-semibold'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
       {/* Optional Footer for settings or logout - can be added later */}
       {/* <div className="mt-auto p-4 border-t">
        <Button variant="outline" className="w-full">
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>
      </div> */}
    </div>
  );
}
