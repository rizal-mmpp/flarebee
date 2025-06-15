
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAllUserProfiles } from '@/lib/firebase/firestoreAdmin';
import type { UserProfile } from '@/lib/types';
import { Users as UsersIcon, Eye, Loader2, MoreHorizontal, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import type { ColumnDef, SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getOrdersByUserIdFromFirestore } from '@/lib/firebase/firestoreOrders'; // To fetch order data

interface CustomerRowData extends UserProfile {
  orderCount: number;
  totalSpent: number;
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getAvatarFallback = (displayName: string | null | undefined) => {
  if (!displayName) return "U";
  const initials = displayName.split(' ').map(name => name[0]).join('').toUpperCase();
  return initials || "U";
};

export default function AdminCustomersPage() {
  const [customerData, setCustomerData] = useState<CustomerRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchTerm = columnFilters.find(f => f.id === 'displayName')?.value as string | undefined;
      const result = await getAllUserProfiles({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchTerm,
      });

      // Fetch order details for each customer to calculate orderCount and totalSpent
      // This can be performance intensive for many customers. Consider denormalizing or optimizing.
      const customersWithOrderStats: CustomerRowData[] = await Promise.all(
        result.data.map(async (user) => {
          try {
            const userOrders = await getOrdersByUserIdFromFirestore(user.uid);
            const completedOrders = userOrders.filter(order => order.status === 'completed' || order.xenditPaymentStatus === 'PAID');
            const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            return {
              ...user,
              orderCount: completedOrders.length,
              totalSpent: totalSpent,
            };
          } catch (orderError) {
            console.warn(`Failed to fetch orders for user ${user.uid}`, orderError);
            return { ...user, orderCount: 0, totalSpent: 0 }; // Default if order fetch fails
          }
        })
      );

      setCustomerData(customersWithOrderStats);
      setPageCount(result.pageCount);
      setTotalItems(result.totalItems);

    } catch (error) {
      console.error("Failed to fetch customer data:", error);
      toast({
        title: "Error Fetching Customers",
        description: "Could not load customer profiles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, sorting, columnFilters, toast]); // Removed fetchOrders from dependency array

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const columns = useMemo<ColumnDef<CustomerRowData, any>[]>(() => [
    {
      accessorKey: "photoURL",
      header: "Avatar",
      cell: ({ row }) => (
        <Avatar className="h-9 w-9">
          <AvatarImage src={row.original.photoURL || undefined} alt={row.original.displayName || 'User'} />
          <AvatarFallback>{getAvatarFallback(row.original.displayName)}</AvatarFallback>
        </Avatar>
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "displayName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <Link href={`/admin/customers/${row.original.uid}`} className="hover:underline text-primary font-medium">
          {row.original.displayName || 'N/A'}
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </Link>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
      cell: ({ row }) => format(new Date(row.original.createdAt), "PP"),
    },
    {
      accessorKey: "orderCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />,
      cell: ({ row }) => row.original.orderCount,
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Spent" />,
      cell: ({ row }) => formatIDR(row.original.totalSpent),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/customers/${row.original.uid}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" disabled>
                <UserX className="mr-2 h-4 w-4" /> Disable User (Future)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <UsersIcon className="mr-3 h-8 w-8 text-primary" />
            Customer Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage customer profiles and their activity. Total: {totalItems}
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Browse and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customerData}
            pageCount={pageCount}
            totalItems={totalItems}
            onPaginationChange={setPagination}
            onSortingChange={setSorting}
            onColumnFiltersChange={setColumnFilters}
            initialPagination={pagination}
            initialSorting={sorting}
            initialColumnFilters={columnFilters}
            isLoading={isLoading}
            searchColumnId="displayName" // Search by name or email (handled in fetchCustomers)
            searchPlaceholder="Search by name or email..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
