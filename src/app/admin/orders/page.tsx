
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAllOrdersFromFirestore } from '@/lib/firebase/firestoreOrders';
import { getUserProfile } from '@/lib/firebase/firestore';
import type { Order, UserProfile } from '@/lib/types';
import { ShoppingCart, Eye, Loader2, MoreHorizontal, RefreshCw, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isValid, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ColumnDef, SortingState, ColumnFiltersState, PaginationState, VisibilityState } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';


interface DisplayOrder extends Order {
  userDisplayName?: string;
}

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

const searchByOrderOptions = [
  { value: 'orderId', label: 'Order ID' },
  { value: 'customer', label: 'Customer' },
  { value: 'amount', label: 'Amount' },
  { value: 'date', label: 'Date' },
  { value: 'status', label: 'Status (Xendit)' },
];

const SEARCH_FILTER_ID = "orderId"; // Changed from "globalFilterValue" to an existing column ID

export default function AdminOrdersPage() {
  const [allFetchedOrders, setAllFetchedOrders] = useState<DisplayOrder[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<DisplayOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [selectedSearchField, setSelectedSearchField] = useState<string>('orderId');
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ items: false, customer: true });
  const [pageCount, setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllOrdersFromFirestore({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      });

      const userIds = Array.from(new Set(result.data.map(order => order.userId).filter(uid => !!uid)));
      const userProfilesMap = new Map<string, UserProfile>();

      if (userIds.length > 0) {
        // Batch fetching user profiles can be very slow if there are many unique userIds.
        // Consider optimizing this if performance becomes an issue (e.g., fetching only for visible rows, or a more complex batching system).
        const profilePromises = userIds.map(uid => getUserProfile(uid));
        const profiles = await Promise.all(profilePromises);
        profiles.forEach(profile => {
          if (profile) {
            userProfilesMap.set(profile.uid, profile);
          }
        });
      }
      
      const enrichedOrders: DisplayOrder[] = result.data.map(order => {
        const profile = userProfilesMap.get(order.userId);
        return {
          ...order,
          userDisplayName: profile?.displayName || order.userEmail || 'Unknown User',
        };
      });

      setAllFetchedOrders(enrichedOrders);
      setPageCount(result.pageCount);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error Fetching Orders",
        description: "Could not load orders.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const filter = columnFilters.find(f => f.id === SEARCH_FILTER_ID);
    const currentSearchTerm = typeof filter?.value === 'string' ? filter.value : '';

    if (currentSearchTerm) {
      const lowerSearchTerm = currentSearchTerm.toLowerCase();
      const filtered = allFetchedOrders.filter(order => {
        switch (selectedSearchField) {
          case 'orderId':
            return order.orderId.toLowerCase().includes(lowerSearchTerm);
          case 'customer':
            return (order.userDisplayName && order.userDisplayName.toLowerCase().includes(lowerSearchTerm)) ||
                   (order.userEmail && order.userEmail.toLowerCase().includes(lowerSearchTerm));
          case 'amount':
            return String(order.totalAmount).includes(currentSearchTerm); 
          case 'date':
            if (!currentSearchTerm) return true;
            // currentSearchTerm is "yyyy-MM-dd" from the date picker
            const orderDate = format(new Date(order.createdAt), "yyyy-MM-dd");
            return orderDate === currentSearchTerm;
          case 'status':
            return order.xenditPaymentStatus?.toLowerCase().includes(lowerSearchTerm) || order.status.toLowerCase().includes(lowerSearchTerm);
          default:
            return true;
        }
      });
      setDisplayedOrders(filtered);
    } else {
      setDisplayedOrders(allFetchedOrders);
    }
  }, [allFetchedOrders, columnFilters, selectedSearchField]);


  const columns = useMemo<ColumnDef<DisplayOrder, any>[]>(() => [
    {
      accessorKey: "orderId",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order ID" />,
      cell: ({ row }) => (
        <Link href={`/admin/orders/${row.original.orderId}`} className="hover:underline text-primary font-medium">
          {row.original.orderId.substring(0, 15)}...
        </Link>
      ),
    },
    {
      id: "customer", 
      accessorFn: row => row.userDisplayName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Link href={`/admin/customers/${order.userId}`} className="hover:underline text-primary font-medium">
            {order.userDisplayName}
          </Link>
        );
      },
      enableHiding: true,
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => formatIDR(row.original.totalAmount),
    },
    {
      accessorKey: "items",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items Qty" />,
      cell: ({ row }) => row.original.items.length,
      enableSorting: false, 
      enableHiding: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => format(new Date(row.original.createdAt), "PP"),
    },
    {
      id: "status",
      accessorFn: row => row.xenditPaymentStatus || row.status, // Prioritize Xendit status for sorting/filtering
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-0.5">
            {row.original.xenditPaymentStatus && (
                 <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(row.original.xenditPaymentStatus))}>
                    X: {row.original.xenditPaymentStatus}
                </Badge>
            )}
             <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(row.original.status))}>
                Doc: {row.original.status}
            </Badge>
        </div>
      ),
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
                <Link href={`/admin/orders/${row.original.orderId}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
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
            <ShoppingCart className="mr-3 h-8 w-8 text-primary" />
            Order Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all customer orders. Total: {totalItems}
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Orders
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>A list of all orders placed on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={displayedOrders}
            pageCount={pageCount}
            totalItems={totalItems}
            onPaginationChange={setPagination}
            onSortingChange={setSorting} 
            onColumnFiltersChange={setColumnFilters}
            onColumnVisibilityChange={setColumnVisibility}
            initialState={{
                pagination,
                sorting,
                columnFilters,
                columnVisibility,
            }}
            manualPagination={true} 
            manualSorting={false}
            manualFiltering={true}
            isLoading={isLoading}
            searchColumnId={SEARCH_FILTER_ID}
            searchPlaceholder="Enter search term..." 
            searchByOptions={searchByOrderOptions}
            selectedSearchBy={selectedSearchField}
            onSelectedSearchByChange={setSelectedSearchField}
            isDateSearch={selectedSearchField === 'date'}
            pageSizeOptions={[20, 50, 100]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

    