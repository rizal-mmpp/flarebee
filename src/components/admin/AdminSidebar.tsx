
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
  CreditCard, // General payment icon
  TestTube2, 
  UploadCloud, 
  LibraryBig, 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  onLinkClick?: () => void; 
}

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/templates', label: 'Templates', icon: LayoutGrid },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/pages', label: 'Site Pages', icon: FileText },
  { href: '/admin/docs', label: 'Documentation', icon: LibraryBig },
  { type: 'divider', key: 'div1' },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
  { type: 'divider', key: 'div2' },
  { href: '/admin/xendit-test', label: 'Xendit Tests', icon: TestTube2 },
  { href: '/admin/ipaymu-test', label: 'iPaymu Tests', icon: CreditCard }, 
  { href: '/admin/file-upload-test', label: 'File Upload Test', icon: UploadCloud },
];

export function AdminSidebar({ onLinkClick }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-sidebar text-sidebar-foreground"> {/* Use sidebar theme variables */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold group text-sidebar-foreground" onClick={onLinkClick}>
          <Hexagon className="h-7 w-7 text-sidebar-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
          <span className="text-lg">RIO Admin</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          {adminNavItems.map((item) => {
            if (item.type === 'divider') {
              return <hr key={item.key} className="my-2 border-sidebar-border/60" />;
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-all hover:text-sidebar-primary hover:bg-sidebar-accent',
                  (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))) && 'bg-sidebar-accent text-sidebar-primary font-semibold'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
