
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
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = 'Filter...',
  searchByOptions,
  selectedSearchBy,
  onSelectedSearchByChange,
  isDateSearch = false,
}: DataTableToolbarProps<TData>) {
  const [localSearchInput, setLocalSearchInput] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const currentTableFilterValue = (table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '';

  useEffect(() => {
    if (currentTableFilterValue === '') {
      setLocalSearchInput('');
      setSelectedDate(undefined);
    } else if (isDateSearch) {
      // When table filter value changes and it's a date search, try to parse and set the date
      const parsedDate = parseISO(currentTableFilterValue);
      if (isValid(parsedDate)) {
        setSelectedDate(parsedDate);
        setLocalSearchInput(format(parsedDate, 'PPP')); // Update local input for display if needed
      } else {
        // If currentTableFilterValue is not a valid ISO date, clear the local date state
        setSelectedDate(undefined);
        setLocalSearchInput(''); // Or set to currentTableFilterValue if it might be partial input
      }
    } else {
      setLocalSearchInput(currentTableFilterValue);
    }
  }, [currentTableFilterValue, searchColumnId, isDateSearch]);

  const handleSearch = () => {
    if (isDateSearch) {
      if (selectedDate) {
        table.getColumn(searchColumnId)?.setFilterValue(format(selectedDate, 'yyyy-MM-dd'));
      } else {
        table.getColumn(searchColumnId)?.setFilterValue('');
      }
      setIsDatePickerOpen(false);
    } else {
      table.getColumn(searchColumnId)?.setFilterValue(localSearchInput);
    }
  };

  const handleReset = () => {
    setLocalSearchInput('');
    setSelectedDate(undefined);
    table.getColumn(searchColumnId)?.setFilterValue('');
    if (isDateSearch) {
      setIsDatePickerOpen(false);
    }
  };

  const isInputOrDateFilled = localSearchInput !== '' || selectedDate !== undefined;
  const isTableFiltered = currentTableFilterValue !== '';

  const dynamicPlaceholder = 
    isDateSearch ? 'Select a date...' :
    (searchByOptions?.find(opt => opt.value === selectedSearchBy)?.label
      ? `Search by ${searchByOptions.find(opt => opt.value === selectedSearchBy)!.label.toLowerCase()}...`
      : searchPlaceholder);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {searchByOptions && onSelectedSearchByChange && selectedSearchBy && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Label htmlFor="search-by-select" className="text-sm font-medium whitespace-nowrap">
              Search by:
            </Label>
            <Select value={selectedSearchBy} onValueChange={(value) => {
              onSelectedSearchByChange(value);
              handleReset(); // Reset search term when search field changes
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
          {isDateSearch ? (
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "h-9 w-full justify-start text-left font-normal rounded-md",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                  }}
                  initialFocus
                />
                 <Button onClick={() => { handleSearch(); setIsDatePickerOpen(false); }} className="w-full rounded-t-none">
                    Apply Date
                </Button>
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              placeholder={dynamicPlaceholder}
              value={localSearchInput}
              onChange={(event) => setLocalSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="h-9 w-full rounded-md" 
            />
          )}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <Button
                aria-label="Search"
                variant="default" // Changed to default for primary background
                size="icon"
                className="h-7 w-7 p-0 shrink-0 rounded-full" 
                onClick={handleSearch}
            >
                <SearchIcon className="h-4 w-4" />
            </Button>
            {(isInputOrDateFilled || isTableFiltered) && (
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
        </div>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}

