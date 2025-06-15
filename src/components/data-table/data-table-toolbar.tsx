
'use client';

import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './data-table-view-options';
import { Button } from '../ui/button';
import { XIcon } from 'lucide-react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchColumnId: string; // The ID of the column to filter
  searchPlaceholder?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = 'Filter...',
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const filterValue = (table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '';

  return (
    <div className="flex items-center justify-between gap-2 p-1">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={filterValue}
          onChange={(event) => table.getColumn(searchColumnId)?.setFilterValue(event.target.value)}
          className="h-8 w-full sm:w-[250px] md:w-[300px] lg:w-[400px]"
        />
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <XIcon className="ml-2 size-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
