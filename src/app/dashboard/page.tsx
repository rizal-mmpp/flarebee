
'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, Settings, Download, Loader2, AlertCircle, ExternalLink, ShoppingBag, CreditCard, Clock, User, LogOut } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { Order } from '@/lib/types';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
      case 'failed':
      case 'expired':
        return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
};

const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) => (
    <Card className="transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return "U";
    const initials = displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    return initials || "U";
};

export default function UserDashboardPage() {
  const { user, signOutUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (user) {
        setIsLoading(true);
        setError(null);
        try {
          const userOrders = await getOrdersByUserIdFromFirestore(user.uid);
          setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err) {
          console.error("Failed to fetch user orders:", err);
          setError("Could not load your order history. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setOrders([]);
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  const { purchasedItemsCount, totalSpent, pendingOrdersCount } = useMemo(() => {
    let purchasedItemsCount = 0;
    let totalSpent = 0;
    let pendingOrdersCount = 0;

    orders.forEach(order => {
        if (order.status === 'completed') {
            purchasedItemsCount += order.items.length;
            totalSpent += order.totalAmount;
        } else if (order.status === 'pending') {
            pendingOrdersCount += 1;
        }
    });

    return { purchasedItemsCount, totalSpent, pendingOrdersCount };
  }, [orders]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-10">
        <div className="lg:col-span-3 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Hello, {user?.displayName || 'User'}!
                </h1>
                <p className="text-muted-foreground">
                    Here's what's happening with your account today, {format(new Date(), 'PPP')}.
                </p>
            </header>

            <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Purchased Items" 
                        value={purchasedItemsCount} 
                        icon={<ShoppingBag className="h-5 w-5 text-muted-foreground" />} 
                        description="Items from completed orders."
                    />
                    <StatCard 
                        title="Total Spent" 
                        value={formatIDR(totalSpent)} 
                        icon={<CreditCard className="h-5 w-5 text-muted-foreground" />} 
                        description="From all completed orders."
                    />
                    <StatCard 
                        title="Pending Orders" 
                        value={pendingOrdersCount} 
                        icon={<Clock className="h-5 w-5 text-muted-foreground" />} 
                        description="Orders awaiting payment."
                    />
                </div>
            </section>

             <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">My Orders</h2>
                {error ? (
                    <Card className="border-destructive bg-destructive/10">
                        <CardHeader>
                        <CardTitle className="text-destructive flex items-center">
                            <AlertCircle className="mr-2 h-5 w-5" /> Error Loading Orders
                        </CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-destructive/80">{error}</p></CardContent>
                    </Card>
                ) : orders.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center">
                        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-xl text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                        <Button asChild><Link href="/">Explore Our Offerings</Link></Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                        <Card key={order.id}>
                            <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                <div>
                                <CardTitle className="text-lg">Order ID: {order.orderId.substring(0, 18)}...</CardTitle>
                                <CardDescription>Placed on: {format(new Date(order.createdAt), "PP")}</CardDescription>
                                </div>
                                <Badge variant="outline" className={cn("capitalize text-xs py-1 px-2.5", getStatusBadgeVariant(order.status))}>
                                Status: {order.status}
                                </Badge>
                            </div>
                            </CardHeader>
                            <CardContent>
                            <ul className="space-y-4">
                                {order.items.map((item) => (
                                <li key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3 rounded-md border bg-card/50">
                                    <div>
                                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">Price: {formatIDR(item.price)}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row items-stretch sm:items-center">
                                    <Button variant="outline" size="sm" asChild className="group w-full sm:w-auto">
                                        <Link href={`/templates/${item.id}`}>
                                            View Details <ExternalLink className="ml-2 h-3 w-3" />
                                        </Link>
                                    </Button>
                                    {(order.status === 'completed' || (order.status === 'pending' && item.id.startsWith(''))) && ( 
                                        <Button size="sm" asChild className="group bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                                            <Link href={`/templates/${item.id}`}><Download className="mr-2 h-4 w-4" /> Access/Download</Link>
                                        </Button>
                                    )}
                                    </div>
                                </li>
                                ))}
                            </ul>
                            </CardContent>
                            {order.status === 'pending' && order.xenditInvoiceUrl && (
                                <CardFooter className="border-t pt-4 flex-col sm:flex-row items-center justify-between gap-2">
                                    <p className="text-sm text-muted-foreground text-center sm:text-left">This order is awaiting payment.</p>
                                    <Button asChild size="sm" className="w-full sm:w-auto group bg-accent hover:bg-accent/90 text-accent-foreground">
                                        <Link href={order.xenditInvoiceUrl} target="_blank" rel="noopener noreferrer"><CreditCard className="mr-2 h-4 w-4"/> Complete Payment</Link>
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                        ))}
                    </div>
                )}
            </section>

        </div>
        <aside className="lg:col-span-1 space-y-6">
            <Card>
                <CardContent className="p-6 text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-4 border-2 border-primary">
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                        <AvatarFallback className="text-3xl">{getAvatarFallback(user?.displayName)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold text-foreground">{user?.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </CardContent>
                <Separator />
                <CardFooter className="p-3">
                     <Button variant="ghost" onClick={signOutUser} className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="outline" asChild className="w-full justify-start text-base py-6"><Link href="/services"><Briefcase className="mr-3 h-5 w-5"/>Explore Services</Link></Button>
                    <Button variant="outline" asChild className="w-full justify-start text-base py-6"><Link href="/checkout"><ShoppingCart className="mr-3 h-5 w-5"/>View Cart</Link></Button>
                    <Button variant="outline" asChild className="w-full justify-start text-base py-6"><Link href="#"><Settings className="mr-3 h-5 w-5"/>Account Settings</Link></Button>
                </CardContent>
            </Card>
        </aside>
    </div>
  );
}
