
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAllTemplatesFromFirestore } from '@/lib/firebase/firestoreTemplates';
import type { Template } from '@/lib/types';
import { LayoutGrid, Loader2, PlusCircle, RefreshCw, Edit2, Trash2, Eye, MoreHorizontal, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteTemplateAction } from '@/lib/actions/template.actions';
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


const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const searchByTemplateOptions = [
  { value: 'title', label: 'Title' },
  { value: 'category.name', label: 'Category' },
  { value: 'price', label: 'Price' },
  { value: 'tags', label: 'Tags' },
];

export default function AdminTemplatesPage() {
  const [allFetchedTemplates, setAllFetchedTemplates] = useState<Template[]>([]);
  const [displayedTemplates, setDisplayedTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedSearchField, setSelectedSearchField] = useState<string>('title');
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'title', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 }); // Default pageSize 20
  const [pageCount, setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  
  const searchColumnId = 'title'; 

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Server-side simplified: only handles pagination. Search term is not passed.
      const result = await getAllTemplatesFromFirestore({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      });
      setAllFetchedTemplates(result.data); 
      setPageCount(result.pageCount);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      console.error("Failed to fetch templates:", error);
      toast({
        title: "Error Fetching Templates",
        description: error.message || "Could not load templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]); // fetchTemplates is memoized with pagination

  // Client-side filtering logic based on selectedSearchField
  useEffect(() => {
    const filter = columnFilters.find(f => f.id === searchColumnId);
    const currentSearchTerm = typeof filter?.value === 'string' ? filter.value.toLowerCase() : '';

    if (currentSearchTerm) {
      const filtered = allFetchedTemplates.filter(template => {
        const lowerSearchTerm = currentSearchTerm;
        switch (selectedSearchField) {
          case 'title':
            return template.title.toLowerCase().includes(lowerSearchTerm);
          case 'category.name':
            return template.category.name.toLowerCase().includes(lowerSearchTerm);
          case 'price':
            return String(template.price).toLowerCase().includes(lowerSearchTerm);
          case 'tags':
            return template.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
          default:
            return true;
        }
      });
      setDisplayedTemplates(filtered);
    } else {
      setDisplayedTemplates(allFetchedTemplates);
    }
  }, [allFetchedTemplates, columnFilters, selectedSearchField, searchColumnId]);


  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      setIsDeleting(templateToDelete.id);
      const result = await deleteTemplateAction(templateToDelete.id);
      if (result.success) {
        toast({ title: "Template Deleted", description: result.message });
        fetchTemplates(); 
      } else {
        toast({ title: "Error Deleting Template", description: result.error, variant: "destructive" });
      }
      setTemplateToDelete(null);
      setIsDeleting(null);
    }
    setDialogOpen(false);
  };

  const columns = useMemo<ColumnDef<Template, any>[]>(() => [
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
          data-ai-hint={row.original.dataAiHint || "template icon"}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "category.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => row.original.category.name,
    },
    {
      accessorKey: "price",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => formatIDR(row.original.price),
    },
    {
      accessorKey: "tags",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tags"/>,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.original.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal text-muted-foreground">{tag}</Badge>
          ))}
          {row.original.tags.length > 3 && <Badge variant="outline" className="text-xs font-normal text-muted-foreground">...</Badge>}
        </div>
      ),
      enableSorting: true, 
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
                <Link href={`/templates/${row.original.id}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" /> View Public <ExternalLink className="ml-auto h-3 w-3"/>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/templates/edit/${row.original.id}`}>
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
  ], [isDeleting, fetchTemplates]);


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <LayoutGrid className="mr-3 h-8 w-8 text-primary" />
            Manage Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, or remove templates. Total available on server: {totalItems}.
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Button onClick={fetchTemplates} variant="outline" disabled={isLoading || !!isDeleting}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh List
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/admin/templates/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Template
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>A list of all templates available on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={displayedTemplates} 
            pageCount={pageCount} 
            totalItems={totalItems} 
            onPaginationChange={setPagination}
            onSortingChange={setSorting} 
            onColumnFiltersChange={setColumnFilters} 
            initialState={{
              pagination, // uses the state variable which has pageSize: 20
              sorting, 
              columnFilters,
            }}
            manualPagination={true} 
            manualSorting={false}   // Client-side sorting
            manualFiltering={true}  // Search bar filter is managed by parent
            isLoading={isLoading}
            searchColumnId={searchColumnId} 
            searchByOptions={searchByTemplateOptions}
            selectedSearchBy={selectedSearchField}
            onSelectedSearchByChange={setSelectedSearchField}
            pageSizeOptions={[20, 50, 100]} // Explicitly pass page size options
          />
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertCircle className="mr-2 h-5 w-5 text-destructive"/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template
              "{templateToDelete?.title}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting === templateToDelete?.id}
            >
              {isDeleting === templateToDelete?.id ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
    
