
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAllOrdersFromFirestore } from '@/lib/firebase/firestoreOrders';
import type { Order } from '@/lib/types';
import { ShoppingCart, Eye, Loader2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ColumnDef, SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export default function AdminOrdersPage() {
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchTerm = columnFilters.find(f => f.id === 'orderId_or_email')?.value as string | undefined;
      const result = await getAllOrdersFromFirestore({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchTerm,
      });
      setOrdersData(result.data);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, sorting, columnFilters, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns = useMemo<ColumnDef<Order, any>[]>(() => [
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
      accessorKey: "userEmail",
      header: ({ column }) => <DataTableColumnHeader column={column} title="User Email" />,
      cell: ({ row }) => row.original.userEmail || 'N/A',
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => formatIDR(row.original.totalAmount),
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => row.original.items.length,
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => format(new Date(row.original.createdAt), "PP"),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <div className="flex flex-col items-start">
            <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(row.original.status))}>
                {row.original.status}
            </Badge>
            {row.original.xenditPaymentStatus && row.original.xenditPaymentStatus.toUpperCase() !== row.original.status.toUpperCase() && (
                <Badge variant="outline" className={cn("capitalize text-xs mt-1", getStatusBadgeVariant(row.original.xenditPaymentStatus))}>
                X: {row.original.xenditPaymentStatus}
                </Badge>
            )}
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
            data={ordersData}
            pageCount={pageCount}
            totalItems={totalItems}
            onPaginationChange={setPagination}
            onSortingChange={setSorting}
            onColumnFiltersChange={setColumnFilters}
            initialPagination={pagination}
            initialSorting={sorting}
            initialColumnFilters={columnFilters}
            isLoading={isLoading}
            searchColumnId="orderId_or_email" // Custom ID for combined search
            searchPlaceholder="Search by Order ID or Email..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
