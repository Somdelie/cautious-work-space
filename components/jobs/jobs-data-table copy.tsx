"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  Eye,
  Pencil,
  Play,
  CheckCircle2,
  Clock,
  ChevronDown,
  Columns3,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ViewJobDialog } from "@/components/dialogs/view-job";
import { DeleteJobDialog } from "@/components/dialogs/delete-job";
import { CreateJobDialog } from "../dialogs/create-job";
import { EditJobDialog } from "../dialogs/edit-job"; // <-- make sure path correct

import { ManagerCombobox } from "@/components/common/ManagerCombobox";
import { SyncJobsButton } from "../common/SyncJobsButton";

import { markJobAsFinished, markJobAsStarted } from "@/actions/job";

type Manager = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
};

export type Job = {
  id: string;
  jobNumber: string;
  siteName: string;

  managerId: string | null;
  supplierId: string | null;

  // ✅ include this if you can (from your schema)
  managerNameRaw?: string | null;

  isStarted: boolean;
  isFinished: boolean;
  createdAt: Date;

  manager: Manager | null;
  supplier: Supplier | null;

  jobProducts: Array<{
    id: string;
    required: boolean;
    quantity: number | null;
    unit: string | null;
  }>;
};

type JobRow =
  | (Job & { _virtual?: false })
  | {
      id: string; // virtual id
      _virtual: true;
      managerId: string;
      manager: Manager;
      supplier: null;
      supplierId: null;
      jobNumber: "";
      siteName: "";
      isStarted: false;
      isFinished: false;
      createdAt: Date;
      jobProducts: [];
      managerNameRaw?: string | null;
    };

function labelForColumn(col: any) {
  switch (String(col?.id ?? "")) {
    case "jobNumber":
      return "Job Number";
    case "siteName":
      return "Site Name";
    case "status":
      return "Status";
    case "manager":
      return "Manager";
    case "supplier":
      return "Supplier";
    case "actions":
      return "Actions";
    default:
      return String(col?.id ?? "Column");
  }
}

function normalizeText(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function JobsDataTable({
  jobs,
  managers: allManagers,
}: {
  jobs: Job[];
  managers: { id: string; name: string }[];
}) {
  const router = useRouter();

  // header controls
  const [managerId, setManagerId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  // table controls
  const tableRef = useRef<Table<JobRow> | null>(null);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);

  const storageKey = "jobs-table";
  const lockColumns = ["actions"];
  const columnAllowList = useMemo(
    () => ["jobNumber", "siteName", "status", "manager", "supplier"],
    [],
  );

  const canReset =
    typeof window !== "undefined" && !!window.localStorage.getItem(storageKey);

  // dialogs + actions
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

  const managers = useMemo(() => allManagers ?? [], [allManagers]);

  const handleMarkAsStarted = useCallback(
    async (jobId: string) => {
      setProcessingJobId(jobId);
      try {
        const result = await markJobAsStarted(jobId);
        if (result?.success) router.refresh();
      } catch (e) {
        console.error("Failed to mark job as started:", e);
      } finally {
        setProcessingJobId(null);
      }
    },
    [router],
  );

  const handleMarkAsFinished = useCallback(
    async (jobId: string) => {
      setProcessingJobId(jobId);
      try {
        const result = await markJobAsFinished(jobId);
        if (result?.success) router.refresh();
      } catch (e) {
        console.error("Failed to mark job as finished:", e);
      } finally {
        setProcessingJobId(null);
      }
    },
    [router],
  );

  const handleManagerChange = (v: string | undefined | null) => {
    setManagerId(v && v.trim() !== "" ? v : undefined);
  };

  const selectedManager =
    managerId && managerId.trim() !== "" ? managerId : undefined;

  const EmptyJobsSvg = (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <svg
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-80"
      >
        <rect
          x="20"
          y="18"
          width="120"
          height="84"
          rx="10"
          className="fill-slate-800/40"
        />
        <rect
          x="34"
          y="34"
          width="92"
          height="10"
          rx="5"
          className="fill-slate-700/60"
        />
        <rect
          x="34"
          y="52"
          width="70"
          height="10"
          rx="5"
          className="fill-slate-700/40"
        />
        <rect
          x="34"
          y="70"
          width="84"
          height="10"
          rx="5"
          className="fill-slate-700/30"
        />
        <circle cx="122" cy="78" r="14" className="fill-slate-900" />
        <path
          d="M116 78h12M122 72v12"
          stroke="rgb(148 163 184)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div className="text-slate-200 font-medium">No jobs for this manager</div>
      <div className="text-slate-400 text-sm">
        Try another manager, or create a new job.
      </div>
    </div>
  );

  const rows: JobRow[] = useMemo(() => {
    const q = normalizeText(search);

    // manager filter:
    // - match by managerId / manager?.id
    // - fallback: managerNameRaw == manager.name (important for Excel imports)
    const managerFiltered: Job[] = selectedManager
      ? jobs.filter((j) => {
          if (j.managerId === selectedManager) return true;
          if (j.manager?.id === selectedManager) return true;

          const m = managers.find((x) => x.id === selectedManager);
          if (m) {
            const raw = normalizeText(j.managerNameRaw);
            const name = normalizeText(m.name);
            if (raw && name && raw === name) return true;
          }
          return false;
        })
      : jobs;

    const searched: Job[] = !q
      ? managerFiltered
      : managerFiltered.filter((j) => {
          if (normalizeText(j.jobNumber).includes(q)) return true;
          if (normalizeText(j.siteName).includes(q)) return true;
          if (normalizeText(j.manager?.name).includes(q)) return true;
          if (normalizeText(j.managerNameRaw).includes(q)) return true;
          if (normalizeText(j.supplier?.name).includes(q)) return true;
          return false;
        });

    // ✅ If a manager is selected, return ONLY real jobs (no virtual rows)
    if (selectedManager) return searched as JobRow[];

    // ✅ If no manager selected: show all jobs + virtual rows for managers with zero jobs
    const managersWithJobs = new Set(
      searched
        .map((j) => j.managerId || j.manager?.id || null)
        .filter(Boolean) as string[],
    );

    const virtualRows: JobRow[] = managers
      .filter((m) => !managersWithJobs.has(m.id))
      .filter((m) => {
        // search should also match manager name
        if (!q) return true;
        return normalizeText(m.name).includes(q);
      })
      .map((m) => ({
        id: `virtual-${m.id}`,
        _virtual: true,
        managerId: m.id,
        manager: { id: m.id, name: m.name },
        supplier: null,
        supplierId: null,
        jobNumber: "",
        siteName: "",
        isStarted: false,
        isFinished: false,
        createdAt: new Date(0),
        jobProducts: [],
        managerNameRaw: m.name,
      }));

    return [...(searched as JobRow[]), ...virtualRows];
  }, [jobs, managers, selectedManager, search]);

  const showEmptyForSelectedManager = !!selectedManager && rows.length === 0;

  const columns: ColumnDef<JobRow>[] = useMemo(
    () => [
      {
        accessorKey: "jobNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="justify-start px-2 font-semibold "
          >
            Job Number
            <ArrowUpDown className=" h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          if ((row.original as any)._virtual) {
            return <span className="text-red-500">Missing</span>;
          }
          return (
            <div className="font-mono font-semibold text-green-500 text-lg leading-5 tracking-wide">
              {String(row.getValue("jobNumber") ?? "")}
            </div>
          );
        },
      },
      {
        accessorKey: "siteName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="justify-start px-2 font-semibold tracking-wide"
          >
            Site Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          if ((row.original as any)._virtual) {
            return (
              <div className="font-medium uppercase text-slate-400">
                No assigned jobs
              </div>
            );
          }
          return (
            <div className="font-medium uppercase text-muted-foreground truncate max-w-[200px] tracking-wide">
              {String(row.getValue("siteName") ?? "")}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const job = row.original as any;

          if (job._virtual) {
            return (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                No jobs
              </Badge>
            );
          }

          if (job.isFinished) {
            return (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wide">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Finished
              </Badge>
            );
          }

          if (job.isStarted) {
            return (
              <Badge className="bg-blue-500/50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-400 border border-blue-500/20 tracking-wide">
                <Clock className="mr-1 h-3 w-3" />
                Ongoing
              </Badge>
            );
          }

          return (
            <Badge className="bg-gray-500/50 dark:bg-slate-500/10 text-slate-300 border border-slate-500/20 tracking-wide">
              Not started
            </Badge>
          );
        },
      },
      {
        id: "manager",
        accessorFn: (row) => (row as any).manager?.name ?? "",
        header: "Supervisor",
        cell: ({ row }) => (
          <div className="min-w-40">
            <div className="capitalize text-teal-600">
              {(row.original as any).manager?.name ?? (
                <span className="opacity-50 text-red-700">Missing</span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "supplier",
        accessorFn: (row) => (row as any).supplier?.name ?? "",
        header: "Supplier",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={`${(row.original as any).supplier ? "bg-orange-600/10 text-orange-400 border border-orange-600/20" : "opacity-50"} text-xs tracking-wide`}
          >
            {(row.original as any).supplier?.name ?? "Missing"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => {
          const job = row.original as any;

          if (job._virtual) {
            return <span className="text-xs text-slate-500 italic">—</span>;
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="h-8 w-8 p-0 bg-teal-800">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

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
    [handleMarkAsStarted, handleMarkAsFinished, processingJobId],
  );

  return (
    <div className="w-full">
      {/* Header Controls */}
      <header className="w-full flex flex-col lg:flex-row lg:items-center md:justify-between gap-2 border-b border-slate-800 pb-2">
        <ManagerCombobox
          value={managerId}
          onChange={handleManagerChange}
          options={managers.map((m) => ({ label: m.name, value: m.id }))}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs..."
          className=" "
        />
        <div className="flex items-center gap-3 w-full">
          {/* Columns dropdown */}
          <div className="relative w-full ">
            <button
              onClick={() => setColumnsDropdownOpen((v) => !v)}
              className="inline-flex items-center justify-start gap-1 sm:gap-2 rounded border border-slate-700 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
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
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-48 sm:w-56 z-50 rounded border border-slate-700 bg-slate-900 shadow-lg">
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
                              className={`flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm rounded hover:bg-slate-800 cursor-pointer ${
                                isLocked ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={col.getIsVisible()}
                                disabled={isLocked}
                                onChange={(e) => {
                                  if (!isLocked) {
                                    col.toggleVisibility(e.target.checked);
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600"
                              />
                              <span className="truncate capitalize text-slate-200">
                                {labelForColumn(col)}
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

          {/* SyncJobsButton */}
          <SyncJobsButton />

          {/* CreateJobDialog */}
          <div className="">
            {" "}
            <CreateJobDialog onSuccess={() => router.refresh()} />
          </div>
        </div>
      </header>

      {/* Table */}
      <div className=" overflow-hidden">
        <DataTable<JobRow>
          data={rows}
          columns={columns as ColumnDef<JobRow, any>[]}
          storageKey={storageKey}
          tableRef={tableRef}
          showColumnToggle={false}
          lockColumns={lockColumns}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          emptyState={showEmptyForSelectedManager ? EmptyJobsSvg : undefined}
        />
      </div>
    </div>
  );
}
