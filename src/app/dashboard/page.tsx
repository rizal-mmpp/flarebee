
'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, Settings, Download, Loader2, AlertCircle, ExternalLink, ShoppingBag, CreditCard, Clock, User, LogOut, ShoppingCart, DollarSign, Receipt } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { Order } from '@/lib/types';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCart } from '@/context/CartContext';


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

const StatCard = ({ title, value, icon, description, action }: { title: string, value: string | number, icon: React.ReactNode, description: string, action?: React.ReactNode }) => (
    <Card className="transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-0.5 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent className="flex-grow">
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
        {action && <CardFooter className="pt-0">{action}</CardFooter>}
    </Card>
);

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { cartItems, getCartTotal, cartLoading } = useCart();
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

  const { upcomingBillingTotal, pendingOrdersCount } = useMemo(() => {
    let upcomingBillingTotal = 0;
    let pendingOrdersCount = 0;

    orders.forEach(order => {
        if (order.status === 'pending') {
            pendingOrdersCount += 1;
            upcomingBillingTotal += order.totalAmount;
        }
    });

    return { upcomingBillingTotal, pendingOrdersCount };
  }, [orders]);
  
  const cartTotal = useMemo(() => getCartTotal(), [getCartTotal, cartItems]);
  const cartItemCount = useMemo(() => cartItems.length, [cartItems]);

  if (isLoading || cartLoading) {
    return (
        <div className="flex items-center justify-center min-h-[40vh] p-4 md:p-6 lg:p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
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
                    title="Upcoming Billing" 
                    value={formatIDR(upcomingBillingTotal)} 
                    icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} 
                    description="Total from all pending orders."
                />
                <StatCard 
                    title="Pending Orders" 
                    value={pendingOrdersCount} 
                    icon={<Clock className="h-5 w-5 text-muted-foreground" />} 
                    description="Orders awaiting payment completion."
                />
                 <StatCard 
                    title="Items in Cart"
                    value={cartItemCount}
                    icon={<ShoppingCart className="h-5 w-5 text-muted-foreground" />}
                    description={`${formatIDR(cartTotal)} total value.`}
                    action={cartItemCount > 0 ? <Button asChild size="sm" className="w-full"><Link href="/dashboard/checkout">View Cart</Link></Button> : undefined}
                />
            </div>
        </section>

        <section>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-foreground">Recent History</h2>
                <Button variant="link" asChild className="text-primary hover:no-underline">
                    <Link href="/dashboard/orders">
                    View all <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
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
                    <Button asChild><Link href="/dashboard/browse-services">Explore Our Offerings</Link></Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.slice(0, 5).map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium text-foreground">
                                    {order.orderId.substring(0, 15)}...
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">
                                    {format(new Date(order.createdAt), "PP")}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                                    {formatIDR(order.totalAmount)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("capitalize text-xs py-1 px-2.5", getStatusBadgeVariant(order.status))}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <Button variant="outline" size="sm" asChild>
                                        <Link href={`/dashboard/orders/${order.orderId}`}>View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </section>
    </div>
  );
}
