'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListOrdered, Loader2, RefreshCw, MoreHorizontal, Eye } from 'lucide-react';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getProjects } from '@/lib/actions/erpnext/project.actions';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


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

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'modified', desc: true }]);

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
                <Button variant="ghost" className="h-8 w-8 p-0">
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
            <ListOrdered className="mr-3 h-8 w-8 text-primary" />
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, track, and deliver client projects.
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
            <Button onClick={fetchProjects} variant="outline" disabled={isLoading}>
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
    </div>
  );
}