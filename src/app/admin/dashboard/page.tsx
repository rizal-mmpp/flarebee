
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getServicesFromErpNext } from '@/lib/actions/erpnext/item.actions';
import { getOrdersFromErpNext } from '@/lib/actions/erpnext/sales-invoice.actions';
import { getUsersFromErpNext } from '@/lib/actions/erpnext/user.actions';
import type { Service, Order, UserProfile } from '@/lib/types'; 
import { LayoutDashboard, BarChart3, Briefcase, FileText, Users, DollarSign, ShoppingCart, Activity, Banknote, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getXenditBalance, type XenditBalanceResult } from '@/lib/actions/xenditAdmin.actions';
import { Button } from '@/components/ui/button';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

import { useRouter } from 'next/navigation';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

export default function AdminDashboardPage() {
  const { isAuthenticated, loading, erpSid } = useCombinedAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, router]);

  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [xenditBalance, setXenditBalance] = useState<XenditBalanceResult | null>(null);
  
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!erpSid) {
        toast({ title: "Authentication Error", description: "Not logged in with ERPNext.", variant: "destructive" });
        return;
    }
    setIsLoadingServices(true);
    setIsLoadingOrders(true);
    setIsLoadingUsers(true);
    setIsLoadingBalance(true);
    try {
      const [servicesResult, ordersResult, usersResult, balanceResult] = await Promise.all([
        getServicesFromErpNext({ sid: erpSid }),
        getOrdersFromErpNext({ sid: erpSid }),    
        getUsersFromErpNext({ sid: erpSid }),          
        getXenditBalance(),
      ]);

      if (servicesResult.success && servicesResult.data) setServices(servicesResult.data);
      else toast({ title: "Error Fetching Services", description: servicesResult.error, variant: "destructive"});

      if (ordersResult.success && ordersResult.data) setOrders(ordersResult.data);
      else toast({ title: "Error Fetching Orders", description: ordersResult.error, variant: "destructive"});

      if (usersResult.success && usersResult.data) setUsers(usersResult.data);
      else toast({ title: "Error Fetching Users", description: usersResult.error, variant: "destructive"});

      setXenditBalance(balanceResult);

    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
      toast({
        title: "Error Fetching Data",
        description: "Could not load all dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingServices(false);
      setIsLoadingOrders(false);
      setIsLoadingUsers(false);
      setIsLoadingBalance(false);
    }
  }, [toast, erpSid]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  const totalSales = orders
    .filter(order => order.status === 'completed' || order.xenditPaymentStatus === 'PAID')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const totalServicesCount = services.length;
  const totalUsersCount = users.length;

  const isLoadingOverall = isLoadingServices || isLoadingOrders || isLoadingUsers || isLoadingBalance;

  return (
    <div className="space-y-8">
      <header className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
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
              <CardTitle className="text-sm font-medium">Total Services</CardTitle> 
              <Briefcase className="h-5 w-5 text-muted-foreground" /> 
            </CardHeader>
            <CardContent>
              {isLoadingServices ? <Loader2 className="h-7 w-7 animate-spin" /> : <div className="text-2xl font-bold">{totalServicesCount}</div>} 
              <p className="text-xs text-muted-foreground">
                Live services offered. 
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
    </div>
  );
}
