
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getOrdersFromErpNext } from '@/lib/actions/erpnext.actions';
import type { Order } from '@/lib/types';
import { ShoppingCart, Eye, Loader2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isValid, parseISO, startOfDay } from 'date-fns';
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
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

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
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'SETTLED':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'PENDING':
    case 'UNPAID': 
    case 'DRAFT':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
    case 'FAILED':
    case 'EXPIRED':
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
    case 'ACTIVE': 
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'STOPPED':
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const searchByOrderOptions = [
  { value: 'orderId', label: 'Invoice ID' },
  { value: 'customer', label: 'Customer' },
  { value: 'amount', label: 'Amount' },
  { value: 'date', label: 'Date' },
  { value: 'status', label: 'Status' },
];

const orderStatusFilterOptions = ["Draft", "Unpaid", "Paid", "Settled", "Expired", "Cancelled"];


const SEARCH_FILTER_ID = "orderId"; 

export default function AdminOrdersPage() {
  const { erpSid } = useCombinedAuth();
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
    if (!erpSid) {
        toast({ title: "Not Authenticated", description: "You must be logged in with ERPNext to view orders.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const result = await getOrdersFromErpNext({ sid: erpSid });

      if (result.success && result.data) {
        setAllFetchedOrders(result.data);
        setTotalItems(result.data.length);
        setPageCount(Math.ceil(result.data.length / pagination.pageSize));
      } else {
        throw new Error(result.error || "Failed to fetch orders.");
      }
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error Fetching Orders",
        description: error.message || "Could not load orders.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [erpSid, toast, pagination.pageSize]);

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
            return String(order.totalAmount).toLowerCase().includes(lowerSearchTerm);
          case 'date':
            const orderDate = new Date(order.createdAt);
            const filterDate = parseISO(currentSearchTerm); // currentSearchTerm is "yyyy-MM-dd"
            if (isValid(orderDate) && isValid(filterDate)) {
              return startOfDay(orderDate).getTime() === startOfDay(filterDate).getTime();
            }
            return false;
          case 'status':
            const orderStatus = order.xenditPaymentStatus?.toLowerCase();
            if (!orderStatus) return false;

            if (lowerSearchTerm === "unpaid") {
              return orderStatus === "pending";
            }
            return orderStatus === lowerSearchTerm;
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sales Invoice ID" />,
      cell: ({ row }) => (
        <Link href={`/admin/orders/${row.original.id}`} className="text-foreground hover:text-primary hover:underline font-medium">
          {row.original.orderId}
        </Link>
      ),
    },
    {
      id: "customer", 
      accessorFn: row => row.userEmail,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => row.original.userEmail || 'N/A',
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Posting Date" />,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return isValid(date) ? format(date, "PP") : 'Invalid Date';
      },
    },
    {
      id: "status", 
      accessorFn: row => row.xenditPaymentStatus,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return status ? (
          <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(status))}>
            {status}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        );
      },
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
                <Link href={`/admin/orders/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);
  
  const handleSelectedSearchByChange = (value: string) => {
    setSelectedSearchField(value);
    const currentFilters = columnFilters.filter(f => f.id !== SEARCH_FILTER_ID);
    setColumnFilters(currentFilters); 
  };


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <ShoppingCart className="mr-3 h-8 w-8 text-primary" />
            Sales Invoices (Orders)
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all customer sales invoices from ERPNext. Total: {totalItems}
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Orders
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>A list of all sales invoices from the platform.</CardDescription>
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
            manualPagination={false} 
            manualSorting={false} 
            manualFiltering={false} 
            isLoading={isLoading}
            searchColumnId={SEARCH_FILTER_ID} 
            searchPlaceholder="Enter search term..." 
            searchByOptions={searchByOrderOptions}
            selectedSearchBy={selectedSearchField}
            onSelectedSearchByChange={handleSelectedSearchByChange}
            isDateSearch={selectedSearchField === 'date'}
            isStatusSearch={selectedSearchField === 'status'}
            statusOptions={orderStatusFilterOptions}
            pageSizeOptions={[20, 50, 100]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
    
