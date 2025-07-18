
'use client';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [20, 50, 100],
}: DataTablePaginationProps<TData>) {
  const currentTablePageSize = table.getState().pagination?.pageSize;

  return (
    <div className="flex w-full flex-col items-center justify-between gap-4 px-2 py-1 sm:flex-row sm:gap-8">
      {/* Left: Page size options */}
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {pageSizeOptions.map((pageSize, index) => (
          <Button
            key={pageSize}
            variant={currentTablePageSize === pageSize ? "default" : "outline"}
            onClick={() => table.setPageSize(Number(pageSize))}
            className={cn(
              "h-9 px-3 py-2 text-sm relative focus:z-10", 
              pageSizeOptions.length === 1 ? "rounded-md" : "",
              pageSizeOptions.length > 1 && index === 0 ? "rounded-l-md rounded-r-none" : "",
              pageSizeOptions.length > 1 && index === pageSizeOptions.length - 1 ? "rounded-r-md rounded-l-none" : "",
              pageSizeOptions.length > 1 && index > 0 && index < pageSizeOptions.length - 1 ? "rounded-none" : "",
              index > 0 ? "-ml-px" : ""
            )}
          >
            {pageSize}
          </Button>
        ))}
      </div>

      {/* Center: Page count */}
      <div className="flex items-center justify-center text-sm font-medium">
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() > 0 ? table.getPageCount() : 1}
      </div>

      {/* Right: Navigation buttons */}
      <div className="flex items-center space-x-2">
        <Button
          aria-label="Go to first page"
          variant="outline"
          className="hidden size-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeftIcon className="size-4" aria-hidden="true" />
        </Button>
        <Button
          aria-label="Go to previous page"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
        </Button>
        <Button
          aria-label="Go to next page"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Button>
        <Button
          aria-label="Go to last page"
          variant="outline"
          size="icon"
          className="hidden size-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage() || table.getPageCount() === 0}
        >
          <ChevronsRightIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
