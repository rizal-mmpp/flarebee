
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/AuthContext';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, CreditCard, Download, ShieldCheck, FileText } from 'lucide-react';
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

export default function BillingPage() {
  const { user } = useAuth();
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getOrdersByUserIdFromFirestore(user.uid)
        .then((userOrders) => {
          // Filter for completed orders to show as billing history
          const filteredOrders = userOrders.filter(order => order.status === 'completed');
          setCompletedOrders(filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        })
        .catch((err) => {
          console.error('Failed to fetch user orders for billing:', err);
          setError('Could not load your billing history. Please try again later.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your billing information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <CreditCard className="mr-3 h-8 w-8 text-primary" />
          Billing
        </h1>
        <Button variant="outline" asChild className="group">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Your payment information is handled securely by our payment partners.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <ShieldCheck className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="font-semibold text-foreground">Secure Payments</p>
              <p className="text-sm text-muted-foreground">We do not store your payment card details. All transactions are securely processed by Xendit and iPaymu.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>A record of all your completed payments and invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive text-center py-8">{error}</div>
          ) : completedOrders.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-4">No billing history found.</p>
              <p className="text-sm text-muted-foreground">Your completed orders will appear here.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/dashboard/orders/${order.orderId}`} className="font-medium text-primary hover:underline">
                          <span title={order.orderId}>{order.orderId.substring(0, 15)}...</span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(order.createdAt), "PPP")}</TableCell>
                      <TableCell>{formatIDR(order.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>
                          <Download className="mr-2 h-4 w-4" /> Download
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
