"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { EditJobDialog } from "../dialogs/edit-job";
import { ChevronDown, Columns3, MoreVertical } from "lucide-react";
import { ManagerCombobox } from "@/components/common/ManagerCombobox";
import { SyncJobsButton } from "../common/SyncJobsButton";
import { CreateJobDialog } from "../dialogs/create-job";
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
import { Badge } from "@/components/ui/badge";
import { ViewJobDialog } from "@/components/dialogs/view-job";
import { DeleteJobDialog } from "@/components/dialogs/delete-job";
import { markJobAsStarted, markJobAsFinished } from "@/actions/job";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// JobRow type
export type JobRow = {
  id: string;
  jobNumber: string;
  siteName: string;
  manager: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
  isStarted: boolean;
  isFinished: boolean;
  client: string | null;
  specsReceived: boolean;
  specNotRequired?: boolean;
  boqReceived?: boolean;
  boqNotRequired?: boolean;
  finishingSchedule: string | null;
  safetyFile: boolean;
  safetyFileNotRequired?: boolean;
  createdAt: Date;

  // ✅ only this new field
  materialCost?: number;
};

import { type SortingState } from "@tanstack/react-table";
import {
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/formatCurrency";

export default function JobsDataTable({ jobs }: { jobs: JobRow[] }) {
  const tableRef = useRef<Table<JobRow> | null>(null);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const storageKey = "jobs-table";
  const lockColumns = ["actions"];
  const columnAllowList = useMemo(
    () => [
      "jobNumber",
      "siteName",
      "manager",
      "supplier",
      "status",
      "client",
      "specsReceived",
      "finishingSchedule",
      "safetyFile",

      // ✅ add
      "materialCost",
    ],
    [],
  );

  const [search, setSearch] = useState("");
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [managerId, setManagerId] = useState<string | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{
    id: string;
    jobNumber: string;
    siteName: string;
  } | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    if (managerId && managerId !== "") {
      filtered = filtered.filter((j) => j.manager?.id === managerId);
    }
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((j) => {
      if (j.jobNumber?.toLowerCase().includes(q)) return true;
      if (j.siteName?.toLowerCase().includes(q)) return true;
      if (j.manager?.name?.toLowerCase().includes(q)) return true;
      if (j.supplier?.name?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [jobs, managerId, search]);

  const handleMarkAsStarted = async (jobId: string) => {
    setProcessingJobId(jobId);
    try {
      const result = await markJobAsStarted(jobId);
      if (result.success) {
        toast.success("Job marked as started");
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
        toast.success("Job marked as finished");
      }
    } catch (error) {
      console.error("Failed to mark job as finished:", error);
    } finally {
      setProcessingJobId(null);
    }
  };

  const data = useMemo(() => jobs, [jobs]);

  const columns = useMemo<ColumnDef<JobRow>[]>(
    () => [
      {
        accessorKey: "jobNumber",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Job Number
          </span>
        ),
        cell: ({ row }) => (
          <span
            className="font-mono text-sm font-medium text-teal-600 tracking-widest max-w-[60px] truncate"
            title={row.original.jobNumber}
          >
            {row.original.jobNumber}
          </span>
        ),
      },
      {
        accessorKey: "siteName",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Site Name
          </span>
        ),
        cell: ({ row }) => (
          <span
            className="block max-w-[360px] truncate text-muted-foreground"
            title={row.original.siteName}
          >
            {row.original.siteName}
          </span>
        ),
      },
      {
        accessorKey: "manager",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manager
          </span>
        ),
        cell: ({ row }) => (
          <span className="capitalize text-teal-600">
            {row.original.manager?.name ?? "Missing"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </span>
        ),
        cell: ({ row }) => {
          if (row.original.isFinished)
            return <span className="text-emerald-400">Finished</span>;
          if (row.original.isStarted)
            return <span className="text-blue-400">Ongoing</span>;
          return <span className="text-slate-400">Not started</span>;
        },
      },
      {
        accessorKey: "supplier",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Supplier
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-orange-600">
            {row.original.supplier?.name ?? "Missing"}
          </span>
        ),
      },

      {
        accessorKey: "client",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Client
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.client ?? "Missing"}
          </span>
        ),
      },

      {
        accessorKey: "specsReceived",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Spec
          </span>
        ),
        cell: ({ row }) => {
          if (row.original.specNotRequired) {
            return <span className="text-muted-foreground">Not Required</span>;
          }
          return (
            <span className="text-muted-foreground">
              {row.original.specsReceived ? (
                "Received"
              ) : (
                <span className="text-destructive/40">Missing</span>
              )}
            </span>
          );
        },
      },

      {
        accessorKey: "safetyFile",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Safety File
          </span>
        ),
        cell: ({ row }) => {
          if (row.original.safetyFileNotRequired) {
            return <span className="text-muted-foreground">Not Required</span>;
          }
          return (
            <span className="text-muted-foreground">
              {row.original.safetyFile ? (
                "Received"
              ) : (
                <span className="text-destructive/40">Missing</span>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "boqReceived",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            BOQ
          </span>
        ),
        cell: ({ row }) => {
          if (row.original.boqNotRequired) {
            return <span className="text-muted-foreground">Not Required</span>;
          }
          return (
            <span className="text-muted-foreground">
              {row.original.boqReceived ? (
                "Received"
              ) : (
                <span className="text-destructive/40">Missing</span>
              )}
            </span>
          );
        },
      },

      {
        accessorKey: "materialCost",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Material Cost
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatCurrency(row.original.materialCost ?? 0)}
          </span>
        ),
      },

      {
        accessorKey: "finishingSchedule",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Finishing Schedule
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.finishingSchedule ?? (
              <span className="text-destructive/40">Missing</span>
            )}
          </span>
        ),
      },

      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </span>
        ),
        cell: ({ row }) => {
          const job = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="h-8 w-8 p-0 bg-green-700 hover:bg-green-700/70 border-0"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
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
    [],
  );

  const canReset =
    typeof window !== "undefined" && !!window.localStorage.getItem(storageKey);

  // Manager options for combobox
  const managerOptions = useMemo(() => {
    const uniqueManagers = Array.from(
      new Map(
        jobs.filter((j) => j.manager).map((j) => [j.manager!.id, j.manager!]),
      ).values(),
    );
    return uniqueManagers.map((m) => ({ label: m.name, value: m.id }));
  }, [jobs]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* left side */}
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className=""
          />
        </div>
        {/* center side */}

        <div className="flex-1">
          {" "}
          <ManagerCombobox
            value={managerId}
            onChange={setManagerId}
            options={managerOptions}
          />
        </div>

        {/* right side */}
        <div className="flex items-center justify-between gap-2">
          <div className="relative">
            <button
              onClick={() => setColumnsDropdownOpen(!columnsDropdownOpen)}
              className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded border border-slate-700 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
              type="button"
            >
              <Columns3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="">Columns</span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            {columnsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setColumnsDropdownOpen(false)}
                />
                <div className="absolute md:right-0 top-full mt-2 w-48 sm:w-56 z-50 rounded border border-slate-700 bg-slate-900 shadow-lg">
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs sm:text-sm font-semibold text-slate-100">
                      Show / Hide columns
                    </div>
                    <div className="my-1 h-px bg-slate-700" />
                    <div className="max-h-[60vh] overflow-y-auto">
                      {(tableRef.current?.getAllLeafColumns?.() ?? [])
                        .filter((c: any) => c.getCanHide?.() !== false)
                        .filter((c: any) =>
                          columnAllowList.includes(String(c.id)),
                        )
                        .map((col: any) => {
                          const isLocked = lockColumns.includes(col.id);
                          return (
                            <label
                              key={col.id}
                              className={`flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm rounded hover:bg-slate-800 cursor-pointer ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={col.getIsVisible()}
                                disabled={isLocked}
                                onChange={(e) => {
                                  if (!isLocked)
                                    col.toggleVisibility(e.target.checked);
                                }}
                                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600"
                              />
                              <span className="truncate capitalize text-slate-200">
                                {col.id}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                    <div className="my-1 h-px bg-slate-700" />
                    <button
                      disabled={!canReset}
                      onClick={() => {
                        if (typeof window === "undefined") return;
                        window.localStorage.removeItem(storageKey);
                        tableRef.current?.setColumnVisibility?.({});
                      }}
                      className="w-full px-2 py-1.5 text-xs sm:text-sm text-left text-slate-200 hover:bg-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <SyncJobsButton />
          <div className="">
            <CreateJobDialog />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-hidden">
        <DataTable<JobRow>
          data={filteredJobs}
          columns={columns}
          storageKey={storageKey}
          tableRef={tableRef}
          showColumnToggle={false}
          lockColumns={lockColumns}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>
      <EditJobDialog
        jobId={editJobId}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditJobId(null);
        }}
        onSuccess={() => {
          setEditDialogOpen(false);
          setEditJobId(null);
        }}
      />
    </div>
  );
}
