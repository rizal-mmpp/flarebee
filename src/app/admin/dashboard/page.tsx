
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { getAllOrdersFromFirestore } from '@/lib/firebase/firestoreOrders';
import { getAllUserProfiles } from '@/lib/firebase/firestoreAdmin'; 
import type { Template, Order, UserProfile } from '@/lib/types';
import { BarChart3, LayoutGrid, FileText, Users, DollarSign, ShoppingCart, Activity, Banknote, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getXenditBalance, type XenditBalanceResult } from '@/lib/actions/xenditAdmin.actions';
import { Button } from '@/components/ui/button';

// Helper to format IDR currency
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AdminDashboardPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [xenditBalance, setXenditBalance] = useState<XenditBalanceResult | null>(null);
  
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoadingTemplates(true);
    setIsLoadingOrders(true);
    setIsLoadingUsers(true);
    setIsLoadingBalance(true);
    try {
      // Pass empty object {} to use default parameters (fetch all)
      const [templatesResult, ordersResult, usersResult, balanceResult] = await Promise.all([
        getAllTemplatesFromFirestore({}), // Fetch all templates
        getAllOrdersFromFirestore({}),    // Fetch all orders
        getAllUserProfiles({}),          // Fetch all users
        getXenditBalance(),
      ]);
      setTemplates(templatesResult.data);
      setOrders(ordersResult.data);
      setUsers(usersResult.data);
      setXenditBalance(balanceResult);

    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
      toast({
        title: "Error Fetching Data",
        description: "Could not load all dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplates(false);
      setIsLoadingOrders(false);
      setIsLoadingUsers(false);
      setIsLoadingBalance(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSales = orders
    .filter(order => order.status === 'completed' || order.xenditPaymentStatus === 'PAID')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const totalTemplatesCount = templates.length;
  const totalUsersCount = users.length;

  const isLoadingOverall = isLoadingTemplates || isLoadingOrders || isLoadingUsers || isLoadingBalance;

  return (
    <div className="space-y-8">
      <header className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <LayoutGrid className="mr-3 h-8 w-8 text-primary" />
          Admin Overview
        </h1>
        <p className="text-muted-foreground">
          Key metrics and insights for Ragam Inovasi Optima.
        </p>
      </header>
      
      <Button onClick={fetchData} disabled={isLoadingOverall} className="mb-6">
          {isLoadingOverall ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Activity className="mr-2 h-4 w-4"/>}
          Refresh All Stats
      </Button>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Xendit Balance</CardTitle>
              <Banknote className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingBalance ? <Loader2 className="h-7 w-7 animate-spin" /> : 
                xenditBalance?.error ? <span className="text-sm text-destructive">Error</span> :
                <div className="text-2xl font-bold">{formatIDR(xenditBalance?.data?.balance ?? 0)}</div>
              }
              <p className="text-xs text-muted-foreground">
                {xenditBalance?.error ? xenditBalance.error.substring(0,30)+'...' : "Available funds in Xendit."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <Loader2 className="h-7 w-7 animate-spin" /> : <div className="text-2xl font-bold">{formatIDR(totalSales)}</div>}
              <p className="text-xs text-muted-foreground">
                From completed orders.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <Loader2 className="h-7 w-7 animate-spin" /> : <div className="text-2xl font-bold">{totalOrdersCount}</div>}
               <p className="text-xs text-muted-foreground">
                All processed orders.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? <Loader2 className="h-7 w-7 animate-spin" /> : <div className="text-2xl font-bold">{totalTemplatesCount}</div>}
              <p className="text-xs text-muted-foreground">
                Live templates available.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
               <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
             {isLoadingUsers ? <Loader2 className="h-7 w-7 animate-spin" /> : <div className="text-2xl font-bold">{totalUsersCount}</div>}
             <p className="text-xs text-muted-foreground">
                Registered user accounts.
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Site (Dummy)</CardTitle>
               <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-500">Online</div>
                <p className="text-xs text-muted-foreground">
                    Site status indicator.
                </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Placeholder for recent activity or charts - To be developed further */}
      {/* <section className="mt-10">
        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6 text-primary" />
          Recent Activity
        </h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Recent sales and user registrations chart will appear here.</p>
          </CardContent>
        </Card>
      </section> */}
    </div>
  );
}
