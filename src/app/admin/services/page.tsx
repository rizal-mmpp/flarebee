
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getServicesFromErpNext, deleteServiceFromErpNext } from '@/lib/actions/erpnext.actions';
import type { Service } from '@/lib/types'; 
import { Briefcase, Loader2, PlusCircle, RefreshCw, Edit2, Trash2, MoreHorizontal, AlertCircle, Eye, Play } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
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

const getStatusBadgeVariant = (status: Service['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'inactive':
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
    case 'draft':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const searchByServiceOptions = [ 
  { value: 'title', label: 'Title' },
  { value: 'category.name', label: 'Category' },
  { value: 'status', label: 'Status' },
  { value: 'tags', label: 'Tags' },
];

export default function AdminServicesPage() { 
  const { erpSid } = useCombinedAuth();
  const [allFetchedServices, setAllFetchedServices] = useState<Service[]>([]); 
  const [displayedServices, setDisplayedServices] = useState<Service[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedSearchField, setSelectedSearchField] = useState<string>('title');
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'title', desc: false }]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null); 
  
  const searchColumnId = 'title'; 

  const fetchServices = useCallback(async () => { 
    if (!erpSid) {
        setIsLoading(false);
        toast({ title: "Authentication Error", description: "Could not retrieve ERPNext session.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      const result = await getServicesFromErpNext({ sid: erpSid });
      if (result.success && result.data) {
        setAllFetchedServices(result.data); 
      } else {
        throw new Error(result.error || "Failed to fetch services.");
      }
    } catch (error: any) {
      console.error("Failed to fetch services:", error); 
      toast({
        title: "Error Fetching Services", 
        description: error.message || "Could not load services.", 
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [erpSid, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const filter = columnFilters.find(f => f.id === searchColumnId);
    const currentSearchTerm = typeof filter?.value === 'string' ? filter.value.toLowerCase() : '';

    if (currentSearchTerm) {
      const filtered = allFetchedServices.filter(service => { 
        const lowerSearchTerm = currentSearchTerm;
        switch (selectedSearchField) {
          case 'title':
            return service.title.toLowerCase().includes(lowerSearchTerm);
          case 'category.name':
            return service.category.name.toLowerCase().includes(lowerSearchTerm);
          case 'status':
            return service.status.toLowerCase().includes(lowerSearchTerm);
          case 'tags':
            return service.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
          default:
            return true;
        }
      });
      setDisplayedServices(filtered); 
    } else {
      setDisplayedServices(allFetchedServices); 
    }
  }, [allFetchedServices, columnFilters, selectedSearchField, searchColumnId]);


  const handleDeleteClick = (service: Service) => { 
    setServiceToDelete(service);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete && erpSid) {
      setIsDeleting(serviceToDelete.id);
      const result = await deleteServiceFromErpNext({ sid: erpSid, serviceName: serviceToDelete.id }); 
      if (result.success) {
        toast({ title: "Service Deleted", description: result.message }); 
        fetchServices(); 
      } else {
        toast({ title: "Error Deleting Service", description: result.error, variant: "destructive" }); 
      }
      setServiceToDelete(null);
      setIsDeleting(null);
    }
    setDialogOpen(false);
  };

  const columns = useMemo<ColumnDef<Service, any>[]>(() => [ 
    {
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => (
        <Image
          src={row.original.imageUrl || 'https://placehold.co/60x40.png'}
          alt={row.original.title}
          width={60}
          height={40}
          className="rounded object-cover"
          data-ai-hint={row.original.dataAiHint || "service icon"}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <Link href={`/admin/services/${row.original.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "category.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => row.original.category.name,
    },
    {
      accessorKey: "priceMin", // Note: The field name might need to be adjusted based on getServicesFromErpNext response
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => formatIDR(row.original.pricing?.fixedPriceDetails?.price),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(row.original.status))}>
          {row.original.status}
        </Badge>
      ),
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
                <Link href={`/admin/services/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/services/edit/${row.original.id}`}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/services/${row.original.id}/simulate-journey`}>
                  <Play className="mr-2 h-4 w-4" /> Run Simulation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(row.original)}
                className="text-destructive focus:text-destructive"
                disabled={isDeleting === row.original.id}
              >
                {isDeleting === row.original.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [isDeleting, fetchServices]);


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Briefcase className="mr-3 h-8 w-8 text-primary" /> 
            Manage Services 
          </h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, or remove services from ERPNext. Total available: {allFetchedServices.length}.
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Button onClick={fetchServices} variant="outline" disabled={isLoading || !!isDeleting}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh List
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/admin/services/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Service
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>A list of all services from ERPNext.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={displayedServices} 
            pageCount={-1} 
            totalItems={allFetchedServices.length} 
            manualPagination={false} 
            manualSorting={false}   
            manualFiltering={false}  
            isLoading={isLoading}
            searchColumnId={searchColumnId} 
            searchPlaceholder="Search services..."
            searchByOptions={searchByServiceOptions} 
            selectedSearchBy={selectedSearchField}
            onSelectedSearchByChange={setSelectedSearchField}
            onColumnFiltersChange={setColumnFilters}
            onSortingChange={setSorting}
            initialState={{ sorting, columnFilters }}
          />
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertCircle className="mr-2 h-5 w-5 text-destructive"/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service
              "{serviceToDelete?.title}" from the ERPNext database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting === serviceToDelete?.id}
            >
              {isDeleting === serviceToDelete?.id ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
