
'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  Home,
  Package,
  CreditCard,
  Puzzle,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { useState, useEffect } from 'react';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface DashboardSidebarProps {
  onLinkClick?: () => void;
  logoUrl?: string | null;
  siteTitle?: string | null;
}

const navGroups = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/services', label: 'My Services', icon: Package },
      { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingCart },
      { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { href: '/dashboard/integrations', label: 'Integrations', icon: Puzzle },
    ],
  },
  {
    title: 'Explore',
    items: [
      { href: '/dashboard/browse-services', label: 'Browse Store', icon: Compass },
      { href: '/', label: 'Back to Homepage', icon: Home },
    ]
  }
];


export function DashboardSidebar({ onLinkClick, logoUrl, siteTitle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useCombinedAuth();
  const { cartItems } = useCart();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      getOrdersByUserIdFromFirestore(user.uid).then(orders => {
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        setPendingOrdersCount(pendingCount);
      }).catch(console.error);
    } else {
      setPendingOrdersCount(0);
    }
  }, [user]);

  const cartItemCount = cartItems.length;
  const totalNotifications = pendingOrdersCount + cartItemCount;

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-border px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold text-foreground group" onClick={onLinkClick}>
           {logoUrl ? (
            <NextImage src={logoUrl} alt={`${siteTitle} Logo`} width={32} height={32} className="h-8 w-8 object-contain" />
          ) : null }
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
                    const isActive = (item.href === '/dashboard' && pathname === item.href) ||
                                     (item.href !== '/dashboard' && pathname.startsWith(item.href));
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
                         <span>{item.label}</span>
                         {item.href === '/dashboard/orders' && pendingOrdersCount > 0 && (
                            <Badge className="ml-auto h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 bg-destructive text-destructive-foreground">
                              {pendingOrdersCount}
                            </Badge>
                          )}
                         {item.href === '/dashboard/billing' && totalNotifications > 0 && (
                            <Badge className="ml-auto h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 bg-destructive text-destructive-foreground">
                              {totalNotifications}
                            </Badge>
                          )}
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
