
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrderByOrderIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order, PurchasedTemplateItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, Package, CalendarDays, User, Tag, Hash, CreditCard, LinkIcon, Clock, Info } from 'lucide-react';
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
    case 'paid': // For Xendit direct status
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


export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      setError(null);
      getOrderByOrderIdFromFirestore(orderId)
        .then((fetchedOrder) => {
          if (fetchedOrder) {
            setOrder(fetchedOrder);
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
  }, [orderId]);

  if (isLoading) {
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
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested order could not be found.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Package className="mr-3 h-8 w-8 text-primary" />
          Order Details
        </h1>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')} className="w-full sm:w-auto group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Order ID: {order.orderId}</CardTitle>
          <CardDescription>
            Details for order placed on {format(new Date(order.createdAt), "PPPp")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Customer Email</h4>
              <p className="text-foreground">{order.userEmail || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Order Date</h4>
              <p className="text-foreground">{format(new Date(order.createdAt), "PPP")}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Total Amount</h4>
              <p className="text-foreground font-semibold text-lg">{formatIDR(order.totalAmount)} ({order.currency})</p>
            </div>
             <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><Hash className="mr-2 h-4 w-4 text-primary" />Flarebee Status</h4>
              <Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(order.status))}>
                {order.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground flex items-center"><CreditCard className="mr-2 h-4 w-4 text-primary" />Payment Gateway</h4>
              <p className="text-foreground capitalize">{order.paymentGateway.replace('_', ' ')}</p>
            </div>
            {order.paymentGateway === 'xendit' && (
              <>
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />Xendit Invoice ID</h4>
                  <p className="text-foreground break-all">{order.xenditInvoiceId || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground flex items-center"><LinkIcon className="mr-2 h-4 w-4 text-primary" />Xendit Invoice URL</h4>
                  {order.xenditInvoiceUrl ? (
                    <Link href={order.xenditInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      View on Xendit <ExternalLink className="inline-block ml-1 h-3 w-3" />
                    </Link>
                  ) : (
                    <p className="text-foreground">N/A</p>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground flex items-center"><Clock className="mr-2 h-4 w-4 text-primary" />Xendit Invoice Expiry</h4>
                  <p className="text-foreground">
                    {order.xenditExpiryDate ? format(new Date(order.xenditExpiryDate), "PPPp") : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground flex items-center"><Hash className="mr-2 h-4 w-4 text-primary" />Xendit Payment Status</h4>
                   {order.xenditPaymentStatus ? (
                     <Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(order.xenditPaymentStatus))}>
                       {order.xenditPaymentStatus}
                     </Badge>
                   ) : (
                    <p className="text-foreground">N/A</p>
                   )}
                </div>
              </>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">Purchased Items ({order.items.length})</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Title</TableHead>
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
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
           <Button variant="outline" onClick={() => router.push('/admin/dashboard')} className="group">
             <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
             Back to Dashboard
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
