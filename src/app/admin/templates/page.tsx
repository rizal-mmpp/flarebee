
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef, SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';


const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AdminTemplatesPage() {
  const [templatesData, setTemplatesData] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // For delete spinner
  const { toast } = useToast();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchTerm = columnFilters.find(f => f.id === 'title')?.value as string | undefined;
      const result = await getAllTemplatesFromFirestore({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchTerm,
      });
      setTemplatesData(result.data);
      setPageCount(result.pageCount);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast({
        title: "Error Fetching Templates",
        description: "Could not load templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, sorting, columnFilters, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

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
        fetchTemplates(); // Refresh the list
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
      accessorKey: "category.name", // Access nested property
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
      header: "Tags",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.original.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          {row.original.tags.length > 3 && <Badge variant="secondary" className="text-xs">...</Badge>}
        </div>
      ),
      enableSorting: false,
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
  ], [isDeleting]);


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <LayoutGrid className="mr-3 h-8 w-8 text-primary" />
            Manage Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, or remove templates. Total: {totalItems}
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
            data={templatesData}
            pageCount={pageCount}
            totalItems={totalItems}
            onPaginationChange={setPagination}
            onSortingChange={setSorting}
            onColumnFiltersChange={setColumnFilters}
            initialPagination={pagination}
            initialSorting={sorting}
            initialColumnFilters={columnFilters}
            isLoading={isLoading}
            searchColumnId="title" // Example: search by title
            searchPlaceholder="Search by title, category, tags..."
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
