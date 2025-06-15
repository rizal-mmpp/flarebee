
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '@/lib/firebase/firestore'; 
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { UserProfile, Order, PurchasedTemplateItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, ServerCrash, User, Mail, CalendarDays, ShoppingCart, DollarSign, Eye, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper to format IDR currency
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
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'failed':
    case 'expired':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return "U";
    const initials = displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    return initials || "U";
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getUserProfile(customerId),
        getOrdersByUserIdFromFirestore(customerId)
      ])
      .then(([fetchedCustomer, fetchedOrders]) => {
        if (fetchedCustomer) {
          setCustomer(fetchedCustomer);
          setOrders(fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } else {
          setError('Customer not found.');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch customer details:', err);
        setError('Failed to load customer details. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading customer details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Customer</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Customer Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested customer could not be found.</p>
         <Button variant="outline" asChild className="group">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }
  
  const totalSpent = orders.filter(o => o.status === 'completed' || o.xenditPaymentStatus === 'PAID').reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={customer.photoURL || undefined} alt={customer.displayName || 'User'} />
                <AvatarFallback className="text-2xl">{getAvatarFallback(customer.displayName)}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {customer.displayName || 'Unnamed User'}
                </h1>
                <p className="text-muted-foreground">{customer.email}</p>
            </div>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/customers')} className="w-full sm:w-auto group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Customers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4 text-primary/80" />User ID</h4>
              <p className="text-foreground text-xs break-all">{customer.uid}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary/80" />Joined Date</h4>
              <p className="text-foreground">{format(new Date(customer.createdAt), "PPP")}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><ShoppingCart className="mr-2 h-4 w-4 text-primary/80" />Total Orders</h4>
              <p className="text-foreground">{orders.length}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><DollarSign className="mr-2 h-4 w-4 text-primary/80" />Total Spent</h4>
              <p className="text-foreground font-semibold">{formatIDR(totalSpent)}</p>
            </div>
             <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4 text-primary/80" />Role</h4>
              <p className="text-foreground capitalize">{customer.role}</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Order History ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">This customer has not placed any orders.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                         <Link href={`/admin/orders/${order.orderId}`} className="hover:underline text-primary">
                            {order.orderId.substring(0,15)}...
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(order.createdAt), "PP")}</TableCell>
                      <TableCell>{formatIDR(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(order.status))}>
                          {order.status}
                        </Badge>
                         {order.xenditPaymentStatus && order.xenditPaymentStatus.toUpperCase() !== order.status.toUpperCase() && (
                             <Badge variant="outline" className={cn("capitalize text-xs ml-1", getStatusBadgeVariant(order.xenditPaymentStatus))}>
                                X: {order.xenditPaymentStatus}
                            </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                           <Link href={`/admin/orders/${order.orderId}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Order</span>
                            </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

