
'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Briefcase, Settings, UserCircle, Download, Loader2, AlertCircle, ExternalLink, ShoppingBag, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Order, PurchasedTemplateItem } from '@/lib/types';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadgeVariant = (status: string) => {
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

export default function UserDashboardPage() {
  const { user } = useAuth();
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
          // Displaying pending and completed orders. Failed/Expired might be less relevant for "My Purchased Templates" view but good for history.
          setOrders(userOrders);
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

  const purchasedAndPendingItemsCount = orders.filter(o => o.status === 'completed' || o.status === 'pending').reduce((sum, order) => sum + order.items.length, 0);

  return (
    <div className="space-y-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome back, {user?.displayName || 'User'}! Manage your purchases and account.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="transition-colors duration-300 hover:border-primary/50"> {/* Removed shadow, added hover border */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active/Purchased Templates
              </CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <div className="text-2xl font-bold text-primary">{purchasedAndPendingItemsCount}</div>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                Templates you've acquired or are processing.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-colors duration-300 hover:border-primary/50"> {/* Removed shadow, added hover border */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Account Settings (Placeholder)
              </CardTitle>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground pt-1">
                    Manage your profile and preferences.
                </p>
            </CardContent>
          </Card>
           <Card className="transition-colors duration-300 hover:border-primary/50"> {/* Removed shadow, added hover border */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div className="text-2xl font-bold text-primary">{orders.length}</div>
                )}
                 <p className="text-xs text-muted-foreground pt-1">
                    All your past and current orders.
                </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">My Orders & Templates</h2>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" /> Error Loading Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/80">{error}</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-4">You haven't placed any orders yet.</p>
              <Button asChild>
                <Link href="/templates">Explore Templates</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}> {/* Removed shadow-md */}
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                      <CardTitle className="text-xl">Order ID: {order.orderId.substring(0, 18)}...</CardTitle>
                      <CardDescription>Placed on: {format(new Date(order.createdAt), "PPP")}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`capitalize text-sm px-3 py-1 ${getStatusBadgeVariant(order.status)}`}>
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
                                View Template <ExternalLink className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                          {(order.status === 'completed' || (order.status === 'pending' && item.id)) && ( // Assuming item ID means template
                             <Button 
                                size="sm" 
                                asChild
                                className="group bg-primary/80 hover:bg-primary/70 text-primary-foreground w-full sm:w-auto"
                              >
                                 <Link href={`/templates/${item.id}`}>
                                    <Download className="mr-2 h-4 w-4" /> Access/Download
                                </Link>
                              </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                 {order.status === 'pending' && order.xenditInvoiceUrl && (
                    <CardFooter className="border-t pt-4 flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground">
                            Your payment for this order is pending.
                            {order.xenditExpiryDate && ` Invoice expires: ${format(new Date(order.xenditExpiryDate), "Pp")}`}
                        </p>
                        <Button asChild size="sm" className="w-full sm:w-auto group bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Link href={order.xenditInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                <CreditCard className="mr-2 h-4 w-4"/> Complete Payment
                            </Link>
                        </Button>
                    </CardFooter>
                )}
                {order.status === 'failed' && (
                     <CardFooter className="border-t pt-4">
                        <p className="text-sm text-destructive">Payment for this order failed or was cancelled.</p>
                    </CardFooter>
                )}
                 {order.status === 'expired' && (
                     <CardFooter className="border-t pt-4">
                        <p className="text-sm text-destructive">The payment link for this order has expired.</p>
                    </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
