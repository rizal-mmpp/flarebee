
'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Briefcase, Settings, UserCircle, Download, Loader2, AlertCircle, ExternalLink, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Order, PurchasedTemplateItem } from '@/lib/types';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
           // Filter for 'pending' or 'completed' orders for display
          const relevantOrders = userOrders.filter(
            (order) => order.status === 'completed' || order.status === 'pending'
          );
          setOrders(relevantOrders);
        } catch (err) {
          console.error("Failed to fetch user orders:", err);
          setError("Could not load your purchased templates. Please try again later.");
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

  const totalPurchasedItems = orders.reduce((sum, order) => sum + order.items.length, 0);

  return (
    <div className="space-y-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome back, {user?.displayName || 'User'}! This is your personal dashboard.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Purchased Templates
              </CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <div className="text-2xl font-bold text-primary">{totalPurchasedItems}</div>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                Total templates you've acquired.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300">
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
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                User Profile (Placeholder)
              </CardTitle>
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground pt-1">
                    View and update your public information.
                </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">My Purchased Templates</h2>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" /> Error Loading Purchases
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
              <p className="text-xl text-muted-foreground mb-4">You haven't purchased any templates yet.</p>
              <Button asChild>
                <Link href="/templates">Explore Templates</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-md">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <CardTitle className="text-xl">Order ID: {order.orderId.substring(0, 18)}...</CardTitle>
                    <Badge variant="secondary">Purchased: {new Date(order.createdAt).toLocaleDateString()}</Badge>
                  </div>
                  <CardDescription>Total: {formatIDR(order.totalAmount)} ({order.items.length} item{order.items.length === 1 ? '' : 's'})</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3 rounded-md border bg-card/50">
                        <div>
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">Price: {formatIDR(item.price)}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" asChild className="group">
                             <Link href={`/templates/${item.id}`}>
                                View Template <ExternalLink className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            asChild
                            className="group bg-primary/80 hover:bg-primary/70 text-primary-foreground"
                            // This assumes template.downloadZipUrl would be fetched or available
                            // For now, we link to the template detail page where the actual download link is
                          >
                             <Link href={`/templates/${item.id}`}>
                                <Download className="mr-2 h-4 w-4" /> Access/Download
                            </Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
