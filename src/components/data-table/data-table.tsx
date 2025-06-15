
'use client';

import * as React from 'react';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TanstackTableInstance, 
  PaginationState, // Added
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar'; 
import { Loader2 } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  totalItems: number;
  onPaginationChange: (pagination: PaginationState) => void; // Updated type
  onSortingChange: (sorting: SortingState) => void;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  onColumnVisibilityChange: (visibility: VisibilityState) => void; // Added prop
  initialState?: { // Use TanStack Table's InitialTableState type definition
    pagination?: PaginationState;
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    columnVisibility?: VisibilityState;
  };
  isLoading?: boolean;
  searchColumnId?: string;
  searchPlaceholder?: string;
  pageSizeOptions?: number[]; // Added this prop
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  totalItems,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  initialState,
  isLoading = false,
  searchColumnId,
  searchPlaceholder,
  pageSizeOptions, // Use this prop
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  
  // These states are now controlled by the parent component via initialState and on-change handlers
  // const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
  // const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialState?.columnFilters ?? []);
  // const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting ?? []);
  // const [pagination, setPagination] = React.useState<PaginationState>(initialState?.pagination ?? { pageIndex: 0, pageSize: 10 });


  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: { // State is now derived from props/initialState passed to useReactTable
      // These are controlled by the hook's internal state, initialized by initialState
      pagination: initialState?.pagination,
      sorting: initialState?.sorting,
      columnVisibility: initialState?.columnVisibility,
      rowSelection,
      columnFilters: initialState?.columnFilters,
    },
    initialState: initialState, // Directly pass the initialState object
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true, // Assuming manual filtering if server-side
    onRowSelectionChange: setRowSelection,
    onSortingChange: onSortingChange, // Directly use the passed handler
    onColumnFiltersChange: onColumnFiltersChange, // Directly use the passed handler
    onColumnVisibilityChange: onColumnVisibilityChange, // Directly use the passed handler
    onPaginationChange: onPaginationChange, // Directly use the passed handler
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Debounce filter changes if searchColumnId is provided
  // This effect should be in the parent component that controls `columnFilters` state
  // For simplicity, it's kept here but be mindful of where state control lies.
  // If columnFilters is fully controlled from parent, this useEffect should be there.
  React.useEffect(() => {
    if (searchColumnId && initialState?.columnFilters) { // Check if columnFilters are part of initialState
      const timeout = setTimeout(() => {
        onColumnFiltersChange(initialState.columnFilters!);
      }, 500); 
      return () => clearTimeout(timeout);
    }
  }, [initialState?.columnFilters, searchColumnId, onColumnFiltersChange]);


  return (
    <div className="w-full space-y-3 overflow-auto">
      {searchColumnId && (
         <DataTableToolbar 
            table={table} 
            searchColumnId={searchColumnId} 
            searchPlaceholder={searchPlaceholder}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                    Loading data...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  );
}
