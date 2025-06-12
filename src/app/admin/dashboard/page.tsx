
'use client';
import { useState, useEffect, useCallback } from 'react';
import { AdminTemplateList } from '@/components/sections/admin/AdminTemplateList';
import { getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import { getAllOrdersFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Template, Order } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { BarChart3, LayoutGrid, Loader2, FileText, Users, DollarSign, ShoppingCart, PlusCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteTemplateAction } from '@/lib/actions/template.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export default function AdminDashboardPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchTemplatesAndOrders = useCallback(async () => {
    setIsLoadingTemplates(true);
    setIsLoadingOrders(true);
    try {
      const fetchedTemplates = await getAllTemplatesFromFirestore();
      setTemplates(fetchedTemplates);
      const fetchedOrders = await getAllOrdersFromFirestore();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error Fetching Data",
        description: "Could not load templates or orders from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplates(false);
      setIsLoadingOrders(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplatesAndOrders();
  }, [fetchTemplatesAndOrders]);

  const handleDeleteTemplate = async (templateId: string) => {
    setIsDeleting(templateId);
    const result = await deleteTemplateAction(templateId);
    if (result.success) {
      toast({
        title: "Template Deleted",
        description: result.message,
      });
      fetchTemplatesAndOrders(); 
    } else {
      toast({
        title: "Error Deleting Template",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsDeleting(null);
  };

  const totalSales = orders
    .filter(order => order.status === 'completed' || order.xenditPaymentStatus === 'PAID')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const totalOrdersCount = orders.length;

  const isLoading = isLoadingTemplates || isLoadingOrders;

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <LayoutGrid className="mr-3 h-8 w-8 text-primary" />
          RIO Admin Panel
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your RIO templates, view orders, and oversee site activity.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6 text-primary" />
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{templates.length}</div>}
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{formatIDR(totalSales)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalOrdersCount}</div>}
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users (Placeholder)</CardTitle>
               <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
             <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>
         <div className="mt-6 flex items-center gap-4">
            <Button onClick={fetchTemplatesAndOrders} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Refresh Data
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/admin/templates/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Template
                </Link>
            </Button>
        </div>
      </section>
      
      <Separator className="my-10" />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Recent Orders</h2>
        {isLoadingOrders ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-center py-8">No orders found yet.</p>
        ) : (
          <Card>
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
                {orders.slice(0, 10).map((order) => ( 
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
                        <Badge variant="outline" className={`capitalize text-xs ${getStatusBadgeVariant(order.status)}`}>
                            {order.status}
                        </Badge>
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
             {orders.length > 10 && (
                <CardContent className="pt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/orders">View All Orders</Link> 
                    </Button>
                </CardContent>
            )}
          </Card>
        )}
      </section>

      <Separator className="my-10" />
      
      <section>
           <h2 className="text-2xl font-semibold text-foreground mb-4">Manage Templates</h2>
           {isLoadingTemplates && templates.length === 0 ? (
             <div className="flex justify-center items-center h-64">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
           ) : (
             <AdminTemplateList 
               templates={templates} 
               onDeleteTemplate={handleDeleteTemplate}
               isDeleting={isDeleting}
            />
           )}
        </section>
    </div>
  );
}
