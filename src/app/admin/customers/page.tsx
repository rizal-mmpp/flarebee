
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAllUserProfiles } from '@/lib/firebase/firestoreAdmin'; // Function to get all user profiles
import { getAllOrdersFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { UserProfile, Order } from '@/lib/types';
import { Users as UsersIcon, Eye, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface CustomerRowData extends UserProfile {
  orderCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return "U";
    const initials = displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    return initials || "U";
  };

  const fetchCustomersAndOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userProfiles, allOrders] = await Promise.all([
        getAllUserProfiles(),
        getAllOrdersFromFirestore(),
      ]);

      const customerData = userProfiles.map(user => {
        const userOrders = allOrders.filter(order => order.userId === user.uid && (order.status === 'completed' || order.xenditPaymentStatus === 'PAID'));
        const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        return {
          ...user,
          orderCount: userOrders.length,
          totalSpent: totalSpent,
        };
      });

      // Sort by join date descending (newest first)
      customerData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCustomers(customerData);

    } catch (error) {
      console.error("Failed to fetch customer data:", error);
      toast({
        title: "Error Fetching Customer Data",
        description: "Could not load customer profiles or orders.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomersAndOrders();
  }, [fetchCustomersAndOrders]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <UsersIcon className="mr-3 h-8 w-8 text-primary" />
            Customer Management
            </h1>
            <p className="text-muted-foreground mt-1">
            View and manage customer profiles and their activity.
            </p>
        </div>
         <Button onClick={fetchCustomersAndOrders} variant="outline" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
            Refresh Customers
        </Button>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>A list of all registered users on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <p className="ml-3 text-muted-foreground">Loading customers...</p>
            </div>
            ) : customers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No customers found.</p>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="hidden sm:table-cell">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {customers.map((customer) => ( 
                    <TableRow key={customer.uid}>
                    <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={customer.photoURL || undefined} alt={customer.displayName || 'User'} />
                            <AvatarFallback>{getAvatarFallback(customer.displayName)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/admin/customers/${customer.uid}`} className="hover:underline text-primary">
                        {customer.displayName || 'N/A'}
                        </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{customer.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{format(new Date(customer.createdAt), "PP")}</TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell>{formatIDR(customer.totalSpent)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/customers/${customer.uid}`}>
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
