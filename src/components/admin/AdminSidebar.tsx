
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
  Package,
  Mail,
  Repeat,
  Briefcase,
  DatabaseZap,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
      { href: '/admin/orders', label: 'Orders (Invoices)', icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/subscription-plans', label: 'Subscription Plans', icon: Repeat },
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
      { href: '/admin/whatsapp-test', label: 'WhatsApp Test', icon: MessageSquare },
      { href: '/admin/xendit-test', label: 'Xendit Tests', icon: TestTube2 },
      { href: '/admin/email-test', label: 'Email Test', icon: Mail },
    ],
  },
];

export function AdminSidebar({ onLinkClick, logoUrl, siteTitle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full max-h-screen flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-border px-4 lg:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-3 font-semibold group text-foreground" onClick={onLinkClick}>
          {logoUrl ? (
            <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={32} height={32} className="h-8 w-8 object-contain" />
          ) : (
            <Hexagon className="h-8 w-8 text-primary transition-transform duration-300 ease-in-out group-hover:rotate-[30deg]" />
          )}
          <span className="text-lg font-bold">{siteTitle}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          className="w-full px-2 lg:px-4 space-y-1"
          defaultValue={navGroups.map(group => group.title)}
        >
          {navGroups.map((group) => (
            <AccordionItem value={group.title} key={group.title} className="border-b-0">
              <AccordionTrigger className="py-2 px-2 text-xs font-semibold uppercase text-sidebar-muted-foreground hover:text-sidebar-foreground hover:no-underline [&[data-state=open]>svg]:text-sidebar-foreground">
                {group.title}
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <nav className="grid items-start text-sm font-medium gap-1">
                  {group.items.map((item) => {
                    const isActive = (item.href === '/admin/dashboard' && pathname === item.href) || 
                                     (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onLinkClick}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          isActive && 'bg-sidebar-active text-sidebar-active-foreground font-semibold'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
