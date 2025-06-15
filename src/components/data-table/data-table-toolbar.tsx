
'use client';

import { useState, useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './data-table-view-options';
import { Button } from '../ui/button';
import { XIcon, SearchIcon } from 'lucide-react'; // Added SearchIcon
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchColumnId: string;
  searchPlaceholder?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = 'Filter...',
}: DataTableToolbarProps<TData>) {
  const [localSearchInput, setLocalSearchInput] = useState<string>('');

  // Effect to initialize localSearchInput if table already has a filter value
  useEffect(() => {
    const currentTableFilter = (table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '';
    setLocalSearchInput(currentTableFilter);
  }, [searchColumnId, table]);

  const handleSearch = () => {
    table.getColumn(searchColumnId)?.setFilterValue(localSearchInput);
  };

  const handleReset = () => {
    setLocalSearchInput('');
    table.getColumn(searchColumnId)?.setFilterValue('');
  };

  // Check if a filter is actively applied *to the table state*
  const isTableFiltered = (table.getState().columnFilters ?? []).some(
    (filter) => filter.id === searchColumnId && !!filter.value
  );

  return (
    <div className="flex items-center justify-between gap-2 p-1">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={localSearchInput}
          onChange={(event) => setLocalSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSearch();
            }
          }}
          className="h-9 w-full sm:w-[250px] md:w-[300px] lg:w-[350px] rounded-md" // Adjusted rounding
        />
        <Button
          aria-label="Search"
          variant="default" // Default variant gives it a background
          size="icon"
          className="h-9 w-9 shrink-0 rounded-md" // Adjusted rounding
          onClick={handleSearch}
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
        {(localSearchInput || isTableFiltered) && ( // Show reset if input has text or table is filtered
          <Button
            aria-label="Reset search"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-md" // Adjusted rounding
            onClick={handleReset}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
