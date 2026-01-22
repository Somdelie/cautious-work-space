/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  pageSize?: number;
  className?: string;

  /**
   * Unique key per table so settings don't clash.
   * Example: "boqguard:jobs:columns"
   */
  storageKey: string;

  /**
   * Optional: columns that are not allowed to be hidden (e.g. actions)
   * Use column ids.
   */
  lockColumns?: string[];
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// Extract a human-friendly label for the column picker
function getColumnLabel<T>(col: any): string {
  const h = col.columnDef?.header;
  if (typeof h === "string") return h;
  if (typeof col.id === "string") return col.id;
  return "Column";
}

export function DataTable<T>({
  data,
  columns,
  pageSize = 5,
  className = "",
  storageKey,
  lockColumns = [],
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Load saved visibility once on mount
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      if (typeof window === "undefined") return {};
      return (
        safeParse<VisibilityState>(window.localStorage.getItem(storageKey)) ??
        {}
      );
    },
  );

  // Persist visibility changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
  }, [columnVisibility, storageKey]);

  const memoData = useMemo(() => data, [data]);
  const memoColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data: memoData,
    columns: memoColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize },
    },
  });

  const hideableColumns = table
    .getAllLeafColumns()
    .filter((c) => c.getCanHide?.() !== false);

  const canReset =
    typeof window !== "undefined" && window.localStorage.getItem(storageKey);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Top actions */}
      <div className="flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-slate-700">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Show / Hide columns</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {hideableColumns.map((col) => {
              const isLocked = lockColumns.includes(col.id);
              return (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  disabled={isLocked}
                  onCheckedChange={(checked) => {
                    // locked columns can't be changed
                    if (isLocked) return;
                    col.toggleVisibility(Boolean(checked));
                  }}
                >
                  <span className="truncate max-w-[180px]">
                    {getColumnLabel<T>(col)}
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}

            <DropdownMenuSeparator />

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              disabled={!canReset}
              onClick={() => {
                if (typeof window === "undefined") return;
                window.localStorage.removeItem(storageKey);
                setColumnVisibility({});
              }}
            >
              Reset to default
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table card */}
      <div className="rounded-lg bg-gray-900/40 border border-slate-800">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[980px]">
            <Table className="w-full table-fixed">
              <TableHeader className="sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-sky-800 hover:bg-sky-800 border-b border-sky-600"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-slate-100 font-semibold px-4 py-3 border-r border-sky-700 last:border-r-0"
                      >
                        <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-white/5 border-b border-slate-800"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-4 py-3 align-middle border-r border-slate-800 last:border-r-0"
                        >
                          {/* default truncation wrapper */}
                          <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-b border-slate-800">
                    <TableCell
                      colSpan={table.getAllLeafColumns().length}
                      className="h-24 text-center text-slate-400"
                    >
                      No data found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
        <div className="text-sm text-slate-400">
          Showing {table.getFilteredRowModel().rows.length} of {memoData.length}{" "}
          data
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border border-slate-700"
          >
            Previous
          </Button>
          <div className="text-sm text-slate-400">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border border-slate-700"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
