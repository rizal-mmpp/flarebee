
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAllUserProfiles } from '@/lib/firebase/firestoreAdmin';
import { getAllOrdersFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { UserProfile, Order } from '@/lib/types';
import { Users as UsersIcon, Eye, Loader2, RefreshCw, Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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

type SortableKey = 'displayName' | 'createdAt' | 'orderCount' | 'totalSpent';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function AdminCustomersPage() {
  const [allCustomers, setAllCustomers] = useState<CustomerRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortableKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
      setAllCustomers(customerData);
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

  const handleSort = (column: SortableKey) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return allCustomers;
    return allCustomers.filter(customer =>
      (customer.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCustomers, searchTerm]);

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      // Handle date sorting for 'createdAt'
      if (sortColumn === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }
      // Handle string sorting for 'displayName'
      else if (sortColumn === 'displayName') {
        valA = (a.displayName || '').toLowerCase();
        valB = (b.displayName || '').toLowerCase();
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCustomers, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedCustomers, currentPage]);

  const renderSortIcon = (column: SortableKey) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    return sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

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
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>Browse and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on new search
                }}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading customers...</p>
            </div>
          ) : paginatedCustomers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? `No customers match "${searchTerm}".` : "No customers found."}
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">Avatar</TableHead>
                      <TableHead onClick={() => handleSort('displayName')} className="cursor-pointer hover:bg-muted transition-colors">
                        <div className="flex items-center">Name {renderSortIcon('displayName')}</div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('createdAt')} className="cursor-pointer hover:bg-muted transition-colors hidden lg:table-cell">
                         <div className="flex items-center">Joined {renderSortIcon('createdAt')}</div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('orderCount')} className="cursor-pointer hover:bg-muted transition-colors">
                        <div className="flex items-center">Orders {renderSortIcon('orderCount')}</div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('totalSpent')} className="cursor-pointer hover:bg-muted transition-colors">
                        <div className="flex items-center">Total Spent {renderSortIcon('totalSpent')}</div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
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
                           <p className="text-xs text-muted-foreground md:hidden">{customer.email}</p>
                        </TableCell>
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
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    