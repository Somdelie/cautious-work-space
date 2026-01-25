"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, Columns3 } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  storageKey: string;
  lockColumns?: string[];
  mobileCardRenderer?: (item: T) => React.ReactNode;

  // expose table instance to parent
  tableRef?: React.MutableRefObject<Table<T> | null>;
  // keep built-in column toggle if you want
  showColumnToggle?: boolean;
  emptyState?: React.ReactNode; // ✅ add
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getColumnLabel(col: any): string {
  const h = col.columnDef?.header;
  if (typeof h === "string") return h;
  if (typeof col.id === "string") return col.id;
  return "Column";
}

export function DataTable<T>({
  data,
  columns,
  pageSize = 5,
  pageSizeOptions = [5, 10, 20, 50, 100],
  className = "",
  storageKey,
  lockColumns = [],
  mobileCardRenderer,
  tableRef,
  showColumnToggle = true,
  emptyState,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ persist page size per table
  const pageSizeStorageKey = `${storageKey}:pageSize`;
  const [pageSizeState, setPageSizeState] = useState<number>(() => {
    if (typeof window === "undefined") return pageSize;
    const raw = window.localStorage.getItem(pageSizeStorageKey);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : pageSize;
  });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      if (typeof window === "undefined") return {};
      const stored = window.localStorage.getItem(storageKey);
      return safeParse<VisibilityState>(stored) ?? {};
    },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
  }, [columnVisibility, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(pageSizeStorageKey, String(pageSizeState));
  }, [pageSizeState, pageSizeStorageKey]);

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
      pagination: { pageSize: pageSizeState },
    },
  });

  // expose table to parent
  useEffect(() => {
    if (tableRef) tableRef.current = table;
  }, [table, tableRef]);

  // keep table page size synced with state
  useEffect(() => {
    table.setPageSize(pageSizeState);
  }, [pageSizeState, table]);

  const hideableColumns = table
    .getAllLeafColumns()
    .filter((c) => c.getCanHide?.() !== false);

  const canReset =
    typeof window !== "undefined" && !!window.localStorage.getItem(storageKey);

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Card View (< 768px) */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg bg-gray-900/40 border border-slate-800 p-4"
            >
              {mobileCardRenderer ? (
                mobileCardRenderer(row.original)
              ) : (
                <div className="space-y-2">
                  {row.getVisibleCells().map((cell) => {
                    const header = cell.column.columnDef.header;
                    const headerText =
                      typeof header === "string" ? header : cell.column.id;

                    return (
                      <div
                        key={cell.id}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="font-medium text-slate-400 min-w-[100px]">
                          {headerText}:
                        </span>
                        <span className="text-slate-100 text-right flex-1">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg bg-gray-900/40 border border-slate-800 p-8 text-center">
            {emptyState ?? (
              <p className="text-slate-400 text-sm">No data found.</p>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View (≥ 768px) */}
      <div className="hidden md:block border dark:border-slate-800 max-h-[71.1vh] overflow-auto">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse relative">
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="dark:bg-teal-800 border-b border-slate-600 bg-sky-900 text-slate-900"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="dark:text-slate-100 px-3 lg:px-4 py-3 border-r dark:border-slate-700 last:border-r-0 text-xs lg:text-sm text-left"
                    >
                      <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="dark:bg-slate-800/80 bg-card/90 text-muted-foreground">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/5 border-b dark:border-gray-700 transition-colors "
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 lg:px-4 py-1 align-middle border-r dark:border-gray-700 last:border-r-0 text-xs lg:text-sm"
                      >
                        <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getAllLeafColumns().length}
                    className="h-24 text-center text-slate-400 text-sm"
                  >
                    <div className="py-10">
                      {emptyState ?? "No data found."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Footer (rows-per-page dropdown added) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-2">
        <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
          Showing {table.getFilteredRowModel().rows.length} of {memoData.length}{" "}
          {memoData.length === 1 ? "item" : "items"}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-slate-400">Rows:</span>
            <select
              value={pageSizeState}
              onChange={(e) => setPageSizeState(Number(e.target.value))}
              className="rounded border border-slate-700 bg-transparent px-4 py-1 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n} className="bg-slate-900">
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border border-slate-700 bg-transparent px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            type="button"
          >
            Previous
          </button>

          <div className="text-xs sm:text-sm text-slate-400 px-1 min-w-20 sm:min-w-[100px] text-center">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border border-slate-700 bg-transparent px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
