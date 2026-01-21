/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  globalFilterPlaceholder?: string;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  globalFilterPlaceholder = "Search...",
  pageSize = 5,
  className = "",
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const memoData = useMemo(() => data, [data]);
  const memoColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data: memoData,
    columns: memoColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={globalFilterPlaceholder}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 bg-card border border-gray-300"
          />
        </div>
      </div>

      <div
        className="rounded bg-gray-900/40 overflow-hidden"
        style={{
          border: '1px solid',
          borderColor: 'var(--tw-border-color, #d1d5db)',
        }}
      >
        <Table
          style={{
            borderCollapse: 'collapse',
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-teal-800 hover:bg-teal-900/50"
                style={{
                  border: '1px solid',
                  borderColor: 'rgb(209 213 219 / 1)',
                  ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? { borderColor: '#374151' } // Tailwind gray-700
                    : {}),
                }}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground font-semibold"
                      style={{
                        border: '1px solid',
                        borderColor: 'rgb(209 213 219 / 1)',
                        ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                          ? { borderColor: '#374151' }
                          : {}),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-accent/50"
                  style={{
                    border: '1px solid',
                    borderColor: 'rgb(209 213 219 / 1)',
                    ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? { borderColor: '#374151' }
                      : {}),
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        border: '1px solid',
                        borderColor: 'rgb(209 213 219 / 1)',
                        ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                          ? { borderColor: '#374151' }
                          : {}),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow
                style={{
                  border: '1px solid',
                  borderColor: 'rgb(209 213 219 / 1)',
                  ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? { borderColor: '#374151' }
                    : {}),
                }}
              >
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                  style={{
                    border: '1px solid',
                    borderColor: 'rgb(209 213 219 / 1)',
                    ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? { borderColor: '#374151' }
                      : {}),
                  }}
                >
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {memoData.length}{" "}
          data
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border border-gray-300"
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border border-gray-300"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
