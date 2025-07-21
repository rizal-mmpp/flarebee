
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, ShoppingCart, Eye, ExternalLink, CreditCard } from 'lucide-react';
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

export default function UserOrdersPage() {
  const { user } = useCombinedAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getOrdersByUserIdFromFirestore(user.uid)
        .then((userOrders) => {
          setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        })
        .catch((err) => {
          console.error('Failed to fetch user orders:', err);
          setError('Could not load your order history. Please try again later.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] p-4 md:p-6 lg:p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <ShoppingCart className="mr-3 h-8 w-8 text-primary" />
          My Orders
        </h1>
        <Button variant="outline" asChild className="group">
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
                Back to Dashboard
            </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Order History</CardTitle>
          <CardDescription>A list of all your purchases and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive text-center py-8">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                <Button asChild><Link href="/services">Explore Services</Link></Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                         <Link href={`/dashboard/orders/${order.orderId}`} className="text-foreground hover:text-primary hover:underline">
                            <span title={order.orderId}>{order.orderId.substring(0, 15)}...</span>
                        </Link>
                      </TableCell>
                      <TableCell>{format(new Date(order.createdAt), "PPP")}</TableCell>
                      <TableCell>{formatIDR(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(order.status))}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {order.status === 'pending' && order.xenditInvoiceUrl ? (
                            <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90">
                              <Link href={order.xenditInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                              </Link>
                            </Button>
                          ) : (
                             <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/orders/${order.orderId}`}>
                                <Eye className="mr-2 h-4 w-4" /> Details
                              </Link>
                            </Button>
                          )}
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
