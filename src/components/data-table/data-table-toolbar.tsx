
'use client';

import { useState, useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './data-table-view-options';
import { Button } from '../ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XIcon, SearchIcon, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid, parseISO } from 'date-fns';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchColumnId: string;
  searchPlaceholder?: string;
  searchByOptions?: { value: string; label: string }[];
  selectedSearchBy?: string;
  onSelectedSearchByChange?: (value: string) => void;
  isDateSearch?: boolean;
  isStatusSearch?: boolean;
  statusOptions?: string[];
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = 'Filter...',
  searchByOptions,
  selectedSearchBy,
  onSelectedSearchByChange,
  isDateSearch = false,
  isStatusSearch = false,
  statusOptions = [],
}: DataTableToolbarProps<TData>) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const currentTableFilterValue = (table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '';

  const handleValueChange = (value: string | undefined) => {
    table.getColumn(searchColumnId)?.setFilterValue(value);
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      handleValueChange(format(date, 'yyyy-MM-dd'));
    } else {
      handleValueChange(undefined);
    }
    setIsDatePickerOpen(false);
  };

  const handleReset = () => {
    handleValueChange(undefined); // Clears the filter for the current searchColumnId
    if (isDateSearch) setIsDatePickerOpen(false);
  };

  const isInputOrFilterActive = currentTableFilterValue !== '';

  const dynamicPlaceholder =
    isDateSearch ? 'Select a date...' :
    isStatusSearch ? 'Select status...' :
    (searchByOptions?.find(opt => opt.value === selectedSearchBy)?.label
      ? `Search by ${searchByOptions.find(opt => opt.value === selectedSearchBy)!.label.toLowerCase()}...`
      : searchPlaceholder);

  const renderSearchInput = () => {
    if (isDateSearch) {
      const selectedDateValue = currentTableFilterValue ? parseISO(currentTableFilterValue) : undefined;
      const displayDate = selectedDateValue && isValid(selectedDateValue) ? format(selectedDateValue, "PPP") : "Pick a date";

      return (
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "h-9 w-full justify-start text-left font-normal rounded-md",
                !currentTableFilterValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {displayDate}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDateValue && isValid(selectedDateValue) ? selectedDateValue : undefined}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    } else if (isStatusSearch) {
      return (
        <Select
          value={currentTableFilterValue}
          onValueChange={(value) => handleValueChange(value === "all-statuses" ? undefined : value)}
        >
          <SelectTrigger className="h-9 rounded-md">
            <SelectValue placeholder={dynamicPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-statuses">All Statuses</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    } else {
      return (
        <Input
          placeholder={dynamicPlaceholder}
          value={currentTableFilterValue}
          onChange={(event) => handleValueChange(event.target.value)}
          className="h-9 w-full rounded-md"
        />
      );
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {searchByOptions && onSelectedSearchByChange && selectedSearchBy && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Label htmlFor="search-by-select" className="text-sm font-medium whitespace-nowrap">
              Search by:
            </Label>
            <Select value={selectedSearchBy} onValueChange={(value) => {
              if (onSelectedSearchByChange) onSelectedSearchByChange(value);
              // Reset filter when search field changes
              handleValueChange(undefined); 
            }}>
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
          {renderSearchInput()}
          {!isDateSearch && !isStatusSearch && ( // Only show explicit search/reset for text input
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <Button
                  aria-label="Search"
                  variant="default"
                  size="icon"
                  className="h-7 w-7 p-0 shrink-0 rounded-full"
                  onClick={() => { /* For text input, search is onType. This button can be a visual cue or removed */ }}
              >
                  <SearchIcon className="h-4 w-4" />
              </Button>
              {isInputOrFilterActive && (
                  <Button
                  aria-label="Reset search"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                  >
                  <XIcon className="h-4 w-4" />
                  </Button>
              )}
            </div>
          )}
          {(isDateSearch || isStatusSearch) && isInputOrFilterActive && ( // Show reset for Date/Status if a filter is active
             <Button
                aria-label="Reset filter"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground ml-1"
                onClick={handleReset}
              >
                <XIcon className="h-4 w-4" />
              </Button>
          )}
        </div>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
