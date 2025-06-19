
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAllServicesFromFirestore } from '@/lib/firebase/firestoreServices'; // Updated import
import type { Service } from '@/lib/types'; // Updated type
import { Briefcase, Loader2, PlusCircle, RefreshCw, Edit2, Trash2, Eye, MoreHorizontal, ExternalLink, AlertCircle } from 'lucide-react'; // Changed icon
import { useToast } from '@/hooks/use-toast';
import { deleteServiceAction } from '@/lib/actions/service.actions'; // Updated import
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

const searchByServiceOptions = [ // Renamed
  { value: 'title', label: 'Title' },
  { value: 'category.name', label: 'Category' },
  { value: 'pricingModel', label: 'Pricing Model' },
  { value: 'status', label: 'Status' },
  { value: 'tags', label: 'Tags' },
];

export default function AdminServicesPage() { // Renamed component
  const [allFetchedServices, setAllFetchedServices] = useState<Service[]>([]); // Updated type
  const [displayedServices, setDisplayedServices] = useState<Service[]>([]); // Updated type
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedSearchField, setSelectedSearchField] = useState<string>('title');
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'title', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [pageCount, setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null); // Updated type
  
  const searchColumnId = 'title'; 

  const fetchServices = useCallback(async () => { // Renamed function
    setIsLoading(true);
    try {
      const result = await getAllServicesFromFirestore({ // Updated function call
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      });
      setAllFetchedServices(result.data); 
      setPageCount(result.pageCount);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      console.error("Failed to fetch services:", error); // Updated message
      toast({
        title: "Error Fetching Services", // Updated message
        description: error.message || "Could not load services.", // Updated message
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const filter = columnFilters.find(f => f.id === searchColumnId);
    const currentSearchTerm = typeof filter?.value === 'string' ? filter.value.toLowerCase() : '';

    if (currentSearchTerm) {
      const filtered = allFetchedServices.filter(service => { // Updated variable name
        const lowerSearchTerm = currentSearchTerm;
        switch (selectedSearchField) {
          case 'title':
            return service.title.toLowerCase().includes(lowerSearchTerm);
          case 'category.name':
            return service.category.name.toLowerCase().includes(lowerSearchTerm);
          case 'pricingModel':
            return service.pricingModel.toLowerCase().includes(lowerSearchTerm);
          case 'status':
            return service.status.toLowerCase().includes(lowerSearchTerm);
          case 'tags':
            return service.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
          default:
            return true;
        }
      });
      setDisplayedServices(filtered); // Updated variable name
    } else {
      setDisplayedServices(allFetchedServices); // Updated variable name
    }
  }, [allFetchedServices, columnFilters, selectedSearchField, searchColumnId]);


  const handleDeleteClick = (service: Service) => { // Updated type
    setServiceToDelete(service);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      setIsDeleting(serviceToDelete.id);
      const result = await deleteServiceAction(serviceToDelete.id); // Updated action call
      if (result.success) {
        toast({ title: "Service Deleted", description: result.message }); // Updated message
        fetchServices(); 
      } else {
        toast({ title: "Error Deleting Service", description: result.error, variant: "destructive" }); // Updated message
      }
      setServiceToDelete(null);
      setIsDeleting(null);
    }
    setDialogOpen(false);
  };

  const columns = useMemo<ColumnDef<Service, any>[]>(() => [ // Updated type
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
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.title}</span>, // Ensured text-foreground for contrast
    },
    {
      accessorKey: "category.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => row.original.category.name,
    },
    {
      accessorKey: "pricingModel",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pricing" />,
      cell: ({ row }) => {
        const service = row.original;
        if (service.pricingModel === "Fixed Price" || service.pricingModel === "Starting At" || service.pricingModel === "Hourly" || service.pricingModel === "Subscription") {
          return `${service.pricingModel} - ${formatIDR(service.priceMin)}`;
        }
        return service.pricingModel;
      },
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
              {/* Public view link will be different for services - to be added later */}
              {/* <DropdownMenuItem asChild>
                <Link href={`/services/${row.original.id}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" /> View Public <ExternalLink className="ml-auto h-3 w-3"/>
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuItem asChild>
                <Link href={`/admin/services/edit/${row.original.id}`}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
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
            <Briefcase className="mr-3 h-8 w-8 text-primary" /> {/* Changed icon */}
            Manage Services 
          </h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, or remove services. Total available: {totalItems}.
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
          <CardDescription>A list of all services offered on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={displayedServices} 
            pageCount={pageCount} 
            totalItems={totalItems} 
            onPaginationChange={setPagination}
            onSortingChange={setSorting} 
            onColumnFiltersChange={setColumnFilters} 
            initialState={{
              pagination,
              sorting, 
              columnFilters,
            }}
            manualPagination={true} 
            manualSorting={false}   
            manualFiltering={true}  
            isLoading={isLoading}
            searchColumnId={searchColumnId} 
            searchPlaceholder="Search services..."
            searchByOptions={searchByServiceOptions} // Updated options
            selectedSearchBy={selectedSearchField}
            onSelectedSearchByChange={setSelectedSearchField}
            pageSizeOptions={[20, 50, 100]}
          />
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertCircle className="mr-2 h-5 w-5 text-destructive"/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service
              "{serviceToDelete?.title}" from the database.
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
