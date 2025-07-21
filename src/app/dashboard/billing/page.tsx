
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, CreditCard, Download, ShieldCheck, FileText, ShoppingCart, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

export default function BillingPage() {
  const { user } = useCombinedAuth();
  const { cartItems, getCartTotal, cartLoading, removeFromCart } = useCart();
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
          console.error('Failed to fetch user orders for billing:', err);
          setError('Could not load your billing information. Please try again later.');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);
  const cartTotal = getCartTotal();
  const isLoadingData = isLoading || cartLoading;

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] p-4 md:p-6 lg:p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your billing information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <CreditCard className="mr-3 h-8 w-8 text-primary" />
          Billing & Payments
        </h1>
        <Button variant="outline" asChild className="group">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      {error && <div className="text-destructive text-center py-8">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Current Cart</CardTitle>
          <CardDescription>Items you have selected but not yet checked out.</CardDescription>
        </CardHeader>
        <CardContent>
          {cartItems.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
              <TableBody>
                {cartItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-right">{formatIDR(item.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">Your cart is empty.</div>
          )}
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total: {formatIDR(cartTotal)}</span>
            <Button asChild><Link href="/dashboard/checkout"><CreditCard className="mr-2 h-4 w-4"/>Proceed to Checkout</Link></Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invoices</CardTitle>
          <CardDescription>These orders have been created and are awaiting payment.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOrders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Invoice ID</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pendingOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell><Link href={`/dashboard/orders/${order.orderId}`} className="font-medium text-primary hover:underline">{order.orderId.substring(0, 15)}...</Link></TableCell>
                      <TableCell>{format(new Date(order.createdAt), "PPP")}</TableCell>
                      <TableCell>{formatIDR(order.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90">
                          <Link href={order.xenditInvoiceUrl || '#'} target="_blank" rel="noopener noreferrer">Pay Now <ExternalLink className="ml-2 h-3 w-3"/></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">You have no pending invoices.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>A record of all your completed payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {completedOrders.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No billing history found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Invoice ID</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell><Link href={`/dashboard/orders/${order.orderId}`} className="font-medium text-primary hover:underline"><span title={order.orderId}>{order.orderId.substring(0, 15)}...</span></Link></TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(order.createdAt), "PPP")}</TableCell>
                      <TableCell>{formatIDR(order.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> Download</Button>
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
