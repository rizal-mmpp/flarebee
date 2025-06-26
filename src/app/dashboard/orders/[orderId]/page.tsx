'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/AuthContext';
import { getOrderByOrderIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, Package, CalendarDays, User, Tag, Hash, CreditCard, LinkIcon, Clock, Info, ExternalLink, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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

const InfoRow = ({ label, value, icon: Icon, children }: { label: string, value?: React.ReactNode, icon?: React.ElementType, children?: React.ReactNode }) => (
    <div className="space-y-1">
        <h4 className="font-semibold text-muted-foreground flex items-center text-xs uppercase tracking-wider">
            {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80" />}
            {label}
        </h4>
        <div className="text-foreground text-sm font-medium">{value}</div>
        {children}
    </div>
);


export default function UserOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.replace('/auth/login');
        return;
    }

    if (orderId && user) {
      setIsLoading(true);
      setError(null);
      getOrderByOrderIdFromFirestore(orderId)
        .then((fetchedOrder) => {
          if (fetchedOrder) {
            // Security check: ensure the fetched order belongs to the logged-in user
            if (fetchedOrder.userId === user.uid) {
                setOrder(fetchedOrder);
            } else {
                setError('You do not have permission to view this order.');
            }
          } else {
            setError('Order not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch order details:', err);
          setError('Failed to load order details. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [orderId, user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Order</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Orders
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!order) {
    // This case might be hit if the error state isn't set but order is null
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Order Not Found</h2>
        <Button variant="outline" asChild className="group">
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Orders
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
                Order Details
            </h1>
             <p className="text-sm text-muted-foreground">
                Order <span className="font-mono text-foreground/80">{order.orderId}</span>
            </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/orders')} className="w-full sm:w-auto group">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Orders
        </Button>
      </div>

       {order.status === 'pending' && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Action Required: Complete Your Payment
            </CardTitle>
             <CardDescription className="text-primary/80">
                This order is pending payment. Please use the link below to complete your purchase.
                The link expires on {order.xenditExpiryDate ? format(new Date(order.xenditExpiryDate), "PPp") : 'the date specified on the payment page'}.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
                <Link href={order.xenditInvoiceUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <CreditCard className="mr-2 h-4 w-4"/>
                    Proceed to Payment
                </Link>
            </Button>
          </CardFooter>
        </Card>
      )}


      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Order Summary</CardTitle>
          <CardDescription>
            Details for your order placed on {format(new Date(order.createdAt), "PPPp")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoRow label="Order Status" icon={Info} value={<Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(order.status))}>{order.status}</Badge>} />
            <InfoRow label="Payment Gateway" icon={CreditCard} value={<span className="capitalize">{order.paymentGateway}</span>} />
            <InfoRow label="Order Total" icon={Tag} value={formatIDR(order.totalAmount)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
             <CardTitle className="text-xl">Purchased Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={`${item.id}-${index}`}>
                      <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                      <TableCell className="text-right text-foreground">{formatIDR(item.price)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50 hover:bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatIDR(order.totalAmount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
