
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrderByOrderIdFromErpNext } from '@/lib/actions/erpnext/sales-invoice.actions';
import type { Order, PurchasedTemplateItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ServerCrash, Package, CalendarDays, User, Tag, Hash, CreditCard, LinkIcon, Clock, Info, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

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
    case 'paid':
    case 'completed':
    case 'settled':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'unpaid':
    case 'pending':
    case 'draft':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
    case 'failed':
    case 'expired':
    case 'cancelled':
      return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const InfoRow = ({ label, value, icon: Icon, children, className }: { label: string, value?: React.ReactNode, icon?: React.ElementType, children?: React.ReactNode, className?: string }) => (
    <div className={cn("space-y-1", className)}>
        <h4 className="font-semibold text-muted-foreground flex items-center text-xs uppercase tracking-wider">
            {Icon && <Icon className="mr-2 h-4 w-4 text-primary/80" />}
            {label}
        </h4>
        <div className="text-foreground text-sm font-medium">{value || <span className="italic text-muted-foreground">Not set</span>}</div>
        {children}
    </div>
);


export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { erpSid } = useCombinedAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && erpSid) {
      setIsLoading(true);
      setError(null);
      getOrderByOrderIdFromErpNext({ sid: erpSid, orderId })
        .then((result) => {
          if (result.success && result.data) {
            setOrder(result.data);
          } else {
            setError(result.error || 'Sales Invoice not found.');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch order details:', err);
          setError('Failed to load Sales Invoice details. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!erpSid) {
        setError('Not authenticated with ERPNext.');
        setIsLoading(false);
    }
  }, [orderId, erpSid]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading invoice details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Invoice</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Sales Invoice Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested invoice could not be found.</p>
        <Button variant="outline" asChild className="group">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>
    );
  }

  const isPaid = order.status === 'paid' || order.status === 'completed' || order.status === 'settled';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
                Invoice Details
            </h1>
            <p className="text-sm text-muted-foreground">
                ID: <span className="font-mono text-foreground/80">{order.orderId}</span>
            </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/orders')} className="w-full sm:w-auto group">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoRow label="Status" icon={Tag} value={<Badge variant="outline" className={cn("capitalize text-sm", getStatusBadgeVariant(order.status))}>{order.status}</Badge>} />
                <InfoRow label="Customer" icon={User} value={order.userEmail} />
                <InfoRow label="Posting Date" icon={CalendarDays} value={format(new Date(order.createdAt), "PPP")} />
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
                            <TableHead>Item Name</TableHead>
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
                            <TableCell>Grand Total</TableCell>
                            <TableCell className="text-right">{formatIDR(order.totalAmount)}</TableCell>
                        </TableRow>
                        </TableBody>
                    </Table>
                  </div>
              </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
                <CardTitle className="text-xl">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPaid ? (
                <>
                   <InfoRow label="Payment Method" icon={CreditCard} value={<span className="capitalize">{order.paymentGateway || 'N/A'}</span>}/>
                   <InfoRow label="Xendit Invoice ID" icon={Hash} value={order.xenditInvoiceId || 'N/A'} />
                   <InfoRow label="Xendit URL" icon={LinkIcon}>
                     {order.xenditInvoiceUrl ? (
                         <Button variant="link" asChild className="p-0 h-auto font-medium">
                             <Link href={order.xenditInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                 View on Xendit <ExternalLink className="ml-2 h-3.5 w-3.5" />
                             </Link>
                         </Button>
                     ) : (
                         <p className="text-sm text-muted-foreground italic">Not available</p>
                     )}
                   </InfoRow>
                </>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  <Clock className="mx-auto h-8 w-8 mb-2" />
                  <p>This invoice is currently unpaid. Payment details will appear here once the payment is completed.</p>
                   {order.xenditInvoiceUrl && (
                    <Button asChild className="mt-4">
                        <Link href={order.xenditInvoiceUrl} target="_blank" rel="noopener noreferrer">
                            <CreditCard className="mr-2 h-4 w-4"/>
                            Open Payment Link
                        </Link>
                    </Button>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
