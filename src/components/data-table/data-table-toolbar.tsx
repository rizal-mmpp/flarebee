
'use client';

import { useState, useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './data-table-view-options';
import { Button } from '../ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XIcon, SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchColumnId: string;
  searchPlaceholder?: string;
  searchByOptions?: { value: string; label: string }[];
  selectedSearchBy?: string;
  onSelectedSearchByChange?: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = 'Filter...',
  searchByOptions,
  selectedSearchBy,
  onSelectedSearchByChange,
}: DataTableToolbarProps<TData>) {
  const [localSearchInput, setLocalSearchInput] = useState<string>('');

  // Effect to clear localSearchInput when table filters are programmatically cleared
  // or when the selected search field changes.
  useEffect(() => {
    const currentTableFilter = (table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '';
    if (currentTableFilter === '') {
      setLocalSearchInput('');
    }
  }, [searchColumnId, table, selectedSearchBy]); // Added selectedSearchBy

  const handleSearch = () => {
    table.getColumn(searchColumnId)?.setFilterValue(localSearchInput);
  };

  const handleReset = () => {
    setLocalSearchInput('');
    table.getColumn(searchColumnId)?.setFilterValue('');
    // Optionally, reset selectedSearchBy to default if needed, handled by parent
  };

  const isTableFiltered = (table.getState().columnFilters ?? []).some(
    (filter) => filter.id === searchColumnId && !!filter.value
  );

  const currentSearchFieldLabel = searchByOptions?.find(opt => opt.value === selectedSearchBy)?.label || '';
  const dynamicPlaceholder = currentSearchFieldLabel 
    ? `Search by ${currentSearchFieldLabel.toLowerCase()}...` 
    : searchPlaceholder;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {searchByOptions && onSelectedSearchByChange && selectedSearchBy && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Label htmlFor="search-by-select" className="text-sm font-medium whitespace-nowrap">
              Search by:
            </Label>
            <Select value={selectedSearchBy} onValueChange={onSelectedSearchByChange}>
              <SelectTrigger id="search-by-select" className="h-9 min-w-[120px] sm:w-auto rounded-md">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {searchByOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="relative flex-grow flex items-center">
          <Input
            placeholder={dynamicPlaceholder}
            value={localSearchInput}
            onChange={(event) => setLocalSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
            className="h-9 w-full rounded-md pr-16 sm:pr-10" // Adjust padding for buttons
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
            <Button
              aria-label="Search"
              variant="default"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-md"
              onClick={handleSearch}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
            {(localSearchInput || isTableFiltered) && (
              <Button
                aria-label="Reset search"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-md ml-1"
                onClick={handleReset}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
