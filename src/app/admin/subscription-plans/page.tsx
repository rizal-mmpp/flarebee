
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getSubscriptionPlansFromErpNext, deleteSubscriptionPlanInErpNext } from '@/lib/actions/erpnext/subscription-plan.actions';
import type { SubscriptionPlan } from '@/lib/types';
import { Repeat, Loader2, PlusCircle, RefreshCw, Edit2, Trash2, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';

const formatIDR = (amount?: number) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AdminSubscriptionPlansPage() {
  const { erpSid } = useCombinedAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'plan_name', desc: false }]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!erpSid) {
        setIsLoading(false);
        toast({ title: "Authentication Error", description: "Could not retrieve ERPNext session.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      const result = await getSubscriptionPlansFromErpNext({ sid: erpSid });
      if (result.success && result.data) {
        setPlans(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch subscription plans.");
      }
    } catch (error: any) {
      toast({ title: "Error Fetching Plans", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [erpSid, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (planToDelete && erpSid) {
      setIsDeleting(planToDelete.name);
      const result = await deleteSubscriptionPlanInErpNext({ sid: erpSid, planName: planToDelete.name });
      if (result.success) {
        toast({ title: "Plan Deleted", description: `Plan "${planToDelete.plan_name}" has been deleted.` });
        fetchPlans();
      } else {
        toast({ title: "Error Deleting Plan", description: result.error, variant: "destructive" });
      }
      setPlanToDelete(null);
      setIsDeleting(null);
    }
    setDialogOpen(false);
  };

  const columns = useMemo<ColumnDef<SubscriptionPlan, any>[]>(() => [
    {
      accessorKey: "plan_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Name" />,
      cell: ({ row }) => (
        <Link href={`/admin/subscription-plans/edit/${row.original.name}`} className="font-medium text-foreground hover:text-primary hover:underline">
          {row.original.plan_name}
        </Link>
      ),
    },
    {
      accessorKey: "item",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Service (Item)" />,
      cell: ({ row }) => row.original.item || <span className="text-muted-foreground italic">Not Linked</span>,
    },
    {
      accessorKey: "cost",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => formatIDR(row.original.cost),
    },
    {
      accessorKey: "billing_interval",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Billing Cycle" />,
      cell: ({ row }) => `${row.original.billing_interval_count} ${row.original.billing_interval}(s)`,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={!!isDeleting}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/subscription-plans/edit/${row.original.name}`}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(row.original)}
                className="text-destructive focus:text-destructive"
                disabled={isDeleting === row.original.name}
              >
                {isDeleting === row.original.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [isDeleting]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Repeat className="mr-3 h-8 w-8 text-primary" />
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage recurring billing plans for your services.
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Button onClick={fetchPlans} variant="outline" disabled={isLoading || !!isDeleting}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh List
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/admin/subscription-plans/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Plan
            </Link>
          </Button>
        </div>
      </header>
      
      <Card>
        <CardContent className="pt-6">
           <DataTable
            columns={columns}
            data={plans}
            pageCount={-1}
            totalItems={plans.length}
            manualPagination={false}
            manualSorting={false}
            manualFiltering={false}
            isLoading={isLoading}
            searchColumnId="plan_name"
            searchPlaceholder="Search by plan name..."
            onColumnFiltersChange={setColumnFilters}
            onSortingChange={setSorting}
            initialState={{ sorting, columnFilters }}
          />
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertCircle className="mr-2 h-5 w-5 text-destructive"/>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscription plan "{planToDelete?.plan_name}" from ERPNext. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting === planToDelete?.name}
            >
              {isDeleting === planToDelete?.name ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>) : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
