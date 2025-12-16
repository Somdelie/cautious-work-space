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
import {
  ArrowUpDown,
  MoreHorizontal,
  Search,
  Trash2,
  Eye,
  Filter,
  Pencil,
  Play,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ViewJobDialog } from "@/components/dialogs/view-job";
import { EditJobDialog } from "@/components/dialogs/edit-job";
import { DeleteJobDialog } from "@/components/dialogs/delete-job";
import { markJobAsStarted, markJobAsFinished } from "@/actions/job";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  jobNumber: string;
  siteName: string;
  managerId: string;
  supplierId: string;
  isStarted: boolean;
  isFinished: boolean;
  createdAt: Date;
  manager: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  supplier: {
    id: string;
    name: string;
  };
  productTypes: Array<{
    id: string;
    type: string;
  }>;
  jobProducts: Array<{
    id: string;
    required: boolean;
    quantity: number | null;
    unit: string | null;
    productType: {
      id: string;
      type: string;
    };
  }>;
};

export function JobsDataTable({ jobs }: { jobs: Job[] }) {
  "use no memo";
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{
    id: string;
    jobNumber: string;
    siteName: string;
  } | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  const handleMarkAsStarted = async (jobId: string) => {
    setProcessingJobId(jobId);
    try {
      const result = await markJobAsStarted(jobId);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark job as started:", error);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleMarkAsFinished = async (jobId: string) => {
    setProcessingJobId(jobId);
    try {
      const result = await markJobAsFinished(jobId);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark job as finished:", error);
    } finally {
      setProcessingJobId(null);
    }
  };

  const data = useMemo(() => jobs, [jobs]);

  const columns: ColumnDef<Job>[] = useMemo(
    () => [
      {
        accessorKey: "jobNumber",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hover:bg-accent/50 -ml-4"
            >
              Job Number
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-mono font-black text-primary text-lg leading-2">
            {row.getValue("jobNumber")}
          </div>
        ),
      },
      {
        accessorKey: "siteName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hover:bg-accent/50 -ml-4"
            >
              Site Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium text-foreground uppercase">
            {row.getValue("siteName")}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const job = row.original;
          if (job.isFinished) {
            return (
              <Badge
                variant="default"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Finished
              </Badge>
            );
          } else if (job.isStarted) {
            return (
              <Badge
                variant="default"
                className="bg-blue-500/10 text-blue-400 border-blue-500/20"
              >
                <Clock className="mr-1 h-3 w-3" />
                Ongoing
              </Badge>
            );
          }
          return null;
        },
      },
      {
        accessorKey: "manager.name",
        header: "Manager",
        cell: ({ row }) => {
          const manager = row.original.manager;
          return (
            <div>
              <div className="font-medium capitalize text-orange-600">{manager.name}</div>
              {manager.email && (
                <div className="text-xs text-muted-foreground lowercase">
                  {manager.email}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.supplier.name,
        id: "supplierName", // Change this from "supplier.name" to "supplierName"
        header: "Supplier",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-medium">
            {row.original.supplier.name}
          </Badge>
        ),
      },
      {
        accessorKey: "ProductsTypes",
        header: "Products Types",
        cell: ({ row }) => {
          const productsTypes = row.original.productTypes;
          return (
            <div className="flex flex-wrap gap-1">
              {productsTypes.length > 0 ? (
                <Badge variant="outline" className="text-xs">
                  {productsTypes.length}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No productsTypes
                </span>
              )}
              {/* {productsTypes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{productsTypes.length - 2}
                </Badge>
              )} */}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hover:bg-accent/50 -ml-4"
            >
              Created
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return (
            <div className="text-sm text-muted-foreground">
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const job = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(job.id)}
                >
                  Copy job ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setEditDialogOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit job
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!job.isStarted && (
                  <DropdownMenuItem
                    onClick={() => handleMarkAsStarted(job.id)}
                    disabled={processingJobId === job.id}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Mark as Started
                  </DropdownMenuItem>
                )}
                {job.isStarted && !job.isFinished && (
                  <DropdownMenuItem
                    onClick={() => handleMarkAsFinished(job.id)}
                    disabled={processingJobId === job.id}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Finished
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setJobToDelete({
                      id: job.id,
                      jobNumber: job.jobNumber,
                      siteName: job.siteName,
                    });
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // React Compiler warning: TanStack Table's useReactTable returns functions that can't be memoized.
  // This is expected - the compiler will skip memoization for this hook (correct behavior).
  const table = useReactTable({
    data,
    columns,
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
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={
              (table.getColumn("supplierName")?.getFilterValue() as string) ?? // Change here
              "all"
            }
            onValueChange={
              (value) =>
                table
                  .getColumn("supplierName")
                  ?.setFilterValue(value === "all" ? "" : value) // And here
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {Array.from(new Set(data.map((job) => job.supplier.name))).map(
                (supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded border border-border bg-gray-900/40 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                  className="border-border hover:bg-accent/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
          jobs
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-border"
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
            className="border-border"
          >
            Next
          </Button>
        </div>
      </div>

      <ViewJobDialog
        jobId={selectedJobId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <EditJobDialog
        jobId={selectedJobId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <DeleteJobDialog
        jobId={jobToDelete?.id ?? null}
        jobNumber={jobToDelete?.jobNumber}
        siteName={jobToDelete?.siteName}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setJobToDelete(null);
          }
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
