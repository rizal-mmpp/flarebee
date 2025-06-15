
'use client';

import * as React from 'react';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TanstackTableInstance, 
  PaginationState, 
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
  onPaginationChange: (pagination: PaginationState) => void; 
  onSortingChange: (sorting: SortingState) => void;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  initialState?: { 
    pagination?: PaginationState;
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    columnVisibility?: VisibilityState;
  };
  manualPagination?: boolean; // Prop to control if pagination is server-side
  manualSorting?: boolean;   // Prop to control if sorting is server-side
  manualFiltering?: boolean; // Prop to control if filtering is server-side
  isLoading?: boolean;
  searchColumnId?: string;
  searchPlaceholder?: string;
  searchByOptions?: { value: string; label: string }[];
  selectedSearchBy?: string;
  onSelectedSearchByChange?: (value: string) => void;
  pageSizeOptions?: number[];
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
  manualPagination = true, // Default to server-side pagination
  manualSorting = true,   // Default to server-side sorting
  manualFiltering = true, // Default to server-side filtering
  isLoading = false,
  searchColumnId,
  searchPlaceholder,
  searchByOptions,
  selectedSearchBy,
  onSelectedSearchByChange,
  pageSizeOptions,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  
  const tablePagination = initialState?.pagination ?? { pageIndex: 0, pageSize: pageSizeOptions?.[0] ?? 20 }; // Fallback to 20
  const tableSorting = initialState?.sorting ?? [];
  const tableColumnFilters = initialState?.columnFilters ?? [];
  const tableColumnVisibility = initialState?.columnVisibility ?? {};

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: { 
      pagination: tablePagination,
      sorting: tableSorting,
      columnVisibility: tableColumnVisibility,
      rowSelection,
      columnFilters: tableColumnFilters,
    },
    enableRowSelection: true,
    manualPagination,
    manualSorting,
    manualFiltering,
    onRowSelectionChange: setRowSelection,
    onSortingChange: onSortingChange, 
    onColumnFiltersChange: onColumnFiltersChange, 
    onColumnVisibilityChange: onColumnVisibilityChange, 
    onPaginationChange: onPaginationChange, 
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });


  return (
    <div className="w-full space-y-3 overflow-auto">
      {searchColumnId && (
         <DataTableToolbar 
            table={table} 
            searchColumnId={searchColumnId} 
            searchPlaceholder={searchPlaceholder}
            searchByOptions={searchByOptions}
            selectedSearchBy={selectedSearchBy}
            onSelectedSearchByChange={onSelectedSearchByChange}
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
    
