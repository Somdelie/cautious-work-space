"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreVertical,
  Trash2,
  Eye,
  Pencil,
  ChevronDown,
  Columns3,
} from "lucide-react";
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
import { toast } from "sonner";
import { deleteOrder } from "@/actions/order";
import { JobCombobox } from "../common/JobCombobox";
import EditOrderDialog from "../dialogs/edit-order";
import { CreateOrderDialog } from "../dialogs/create-order";

export type UIOrder = {
  id: string;
  orderNumber: string;
  job: { id: string; jobNumber: string; siteName: string } | null;
  supplier: { id: string; name: string } | null; // UI needs this
  createdAt: string | Date;
  status?: string;
  items: Array<{ id: string; quantity: number; unit: string }>;
};

export function OrdersDataTable({
  orders,
  jobs,
  onOrderDeleted,
  onOrderEdited,
}: {
  orders: UIOrder[];
  jobs: { id: string; jobNumber: string; siteName: string }[];
  onOrderDeleted?: () => void;
  onOrderEdited?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const tableRef = useRef<Table<UIOrder> | null>(null);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const storageKey = "orders-table";
  const lockColumns = ["actions"];
  const columnAllowList = useMemo(
    () => ["orderNumber", "job", "supplier", "createdAt", "status"],
    [],
  );

  const jobsOptions = useMemo(
    () =>
      jobs.map((j) => ({
        label: `${j.jobNumber} - ${j.siteName}`,
        value: j.id,
      })),
    [jobs],
  );

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (jobId) filtered = filtered.filter((o) => o.job?.id === jobId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.job?.jobNumber.toLowerCase().includes(q) ||
          o.job?.siteName.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [orders, jobId, search]);

  const columns: ColumnDef<UIOrder>[] = useMemo(
    () => [
      {
        accessorKey: "orderNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="justify-start px-2 font-semibold "
          >
            Order #
            <ArrowUpDown className=" h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-mono font-semibold text-green-500 text-lg leading-5 tracking-wide">
            {String(row.getValue("orderNumber") ?? "")}
          </div>
        ),
      },
      {
        id: "job",
        accessorFn: (row) =>
          row.job ? `${row.job.jobNumber} - ${row.job.siteName}` : "",
        header: "Job",
        cell: ({ row }) => (
          <div className="capitalize text-teal-600">
            {row.original.job ? (
              `${row.original.job.jobNumber} - ${row.original.job.siteName}`
            ) : (
              <span className="opacity-50 text-red-700">Missing</span>
            )}
          </div>
        ),
      },
      {
        id: "supplier",
        accessorFn: (row) => row.supplier?.name ?? "",
        header: "Supplier",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={`${row.original.supplier ? "bg-orange-600/10 text-orange-400 border border-orange-600/20" : "opacity-50"} text-xs tracking-wide`}
          >
            {row.original.supplier?.name ?? "Missing"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="justify-start px-2 font-semibold "
          >
            Created
            <ArrowUpDown className=" h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => (
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
                  setSelectedOrderId(row.original.id);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit order
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  setDeleting(row.original.id);
                  const result = await deleteOrder(row.original.id);
                  if (result.success) {
                    toast.success("Order deleted");
                    onOrderDeleted?.();
                  } else {
                    toast.error(result.error || "Failed to delete order");
                  }
                  setDeleting(null);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onOrderDeleted],
  );

  return (
    <div className="w-full">
      <header className="w-full flex flex-col lg:flex-row lg:items-center md:justify-between gap-2 border-b border-slate-800 pb-2">
        <JobCombobox value={jobId} onChange={setJobId} options={jobsOptions} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className=" "
        />
        <div className="flex items-center gap-3 w-full">
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
                                {col.id.charAt(0).toUpperCase() +
                                  col.id.slice(1)}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                    <div className="my-1 h-px bg-slate-700" />
                    <button
                      disabled={false}
                      onClick={() => {
                        if (typeof window === "undefined") return;
                        window.localStorage.removeItem(storageKey);
                        tableRef.current?.setColumnVisibility?.({});
                      }}
                      className="w-full px-2 py-1.5 text-xs sm:text-sm text-left text-slate-200 hover:bg-slate-800 rounded"
                      type="button"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <CreateOrderDialog />
        </div>
      </header>
      <div className=" w-full">
        <DataTable<UIOrder>
          data={filteredOrders}
          columns={columns as ColumnDef<UIOrder, any>[]}
          storageKey={storageKey}
          tableRef={tableRef}
          showColumnToggle={false}
          lockColumns={lockColumns}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>
      <EditOrderDialog
        orderId={selectedOrderId ?? ""}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false);
          onOrderEdited?.();
        }}
      />
    </div>
  );
}
