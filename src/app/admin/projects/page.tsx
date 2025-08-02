
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListOrdered, Loader2, RefreshCw, MoreHorizontal, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getProjects, deleteProject } from '@/lib/actions/erpnext/project.actions';
import type { Project } from '@/lib/types';
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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


const getStatusBadgeVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'in progress':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'awaiting payment':
    case 'awaiting delivery':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
    case 'draft':
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};


export default function AdminProjectsPage() {
    const { erpSid } = useCombinedAuth();
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'modified', desc: true }]);
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!erpSid) {
            toast({ title: "Authentication Error", description: "Not logged in to ERPNext.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const result = await getProjects({ sid: erpSid });
        if (result.success && result.data) {
            setProjects(result.data);
        } else {
            toast({ title: "Error", description: result.error || "Could not fetch projects.", variant: "destructive" });
        }
        setIsLoading(false);
    }, [erpSid, toast]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);
    
    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project);
        setDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (projectToDelete && erpSid) {
            setIsDeleting(projectToDelete.name);
            const result = await deleteProject({ sid: erpSid, projectName: projectToDelete.name });
            if (result.success) {
                toast({ title: "Project Deleted", description: `Project "${projectToDelete.project_name}" has been deleted.` });
                fetchProjects();
            } else {
                toast({ title: "Error Deleting Project", description: result.error, variant: "destructive" });
            }
            setProjectToDelete(null);
            setIsDeleting(null);
        }
        setDialogOpen(false);
    };

    const columns = useMemo<ColumnDef<Project, any>[]>(() => [
      {
        accessorKey: 'project_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Project Name" />,
        cell: ({ row }) => (
          <Link href={`/admin/projects/${row.original.name}`} className="font-medium text-foreground hover:text-primary hover:underline">
            {row.original.project_name}
          </Link>
        ),
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant="outline" className={cn("capitalize text-xs", getStatusBadgeVariant(row.original.status))}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'modified',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Modified" />,
        cell: ({ row }) => format(new Date(row.original.modified), "PP"),
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
                  <Link href={`/admin/projects/${row.original.name}`}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link href={`/admin/projects/edit/${row.original.name}`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => handleDeleteClick(row.original)}
                    className="text-destructive focus:text-destructive"
                    disabled={isDeleting === row.original.name}
                >
                    {isDeleting === row.original.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
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
            <ListOrdered className="mr-3 h-8 w-8 text-primary" />
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, track, and deliver client projects.
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
            <Button onClick={fetchProjects} variant="outline" disabled={isLoading || !!isDeleting}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh Projects
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/admin/projects/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Project
                </Link>
            </Button>
        </div>
      </header>

       <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>A list of all client projects will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={projects}
            pageCount={-1}
            totalItems={projects.length}
            manualPagination={false}
            manualSorting={false}
            manualFiltering={false}
            isLoading={isLoading}
            searchColumnId="project_name"
            searchPlaceholder="Search by project name..."
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
              This action cannot be undone. This will permanently delete the project "{projectToDelete?.project_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting === projectToDelete?.name}
            >
              {isDeleting === projectToDelete?.name ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>) : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
