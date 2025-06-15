
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAllOrdersFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order } from '@/lib/types';
import { ShoppingCart, Eye, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const fetchedOrders = await getAllOrdersFromFirestore();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error Fetching Orders",
        description: "Could not load orders from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <ShoppingCart className="mr-3 h-8 w-8 text-primary" />
            Order Management
            </h1>
            <p className="text-muted-foreground mt-1">
            View and manage all customer orders.
            </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" disabled={isLoadingOrders}>
            {isLoadingOrders ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
            Refresh Orders
        </Button>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>A list of all orders placed on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingOrders ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading orders...</p>
            </div>
            ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders found.</p>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="hidden sm:table-cell">User Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
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
                    <TableCell className="hidden sm:table-cell">{order.userEmail || 'N/A'}</TableCell>
                    <TableCell>{formatIDR(order.totalAmount)}</TableCell>
                    <TableCell className="hidden md:table-cell">{order.items.length}</TableCell>
                    <TableCell className="hidden lg:table-cell">{format(new Date(order.createdAt), "PP")}</TableCell>
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
                                <span className="sr-only">View Details</span>
                            </Link>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
