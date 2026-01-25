"use client";

import { useState, useMemo, useRef } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ChevronDown, Columns3, Pencil, Trash } from "lucide-react";
import { EditManagerDialog } from "../dialogs/edit-manager";
import { CreateManagerDialog } from "../dialogs/create-manager";
import { DeleteManagerDialog } from "../dialogs/delete-manager";

export type ManagerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export function ManagersTable({ managers }: { managers: ManagerRow[] }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(
    null,
  );
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const storageKey = "jobs-table";
  const lockColumns = ["actions"];
  const columnAllowList = useMemo(() => ["name", "email", "phone"], []);
  const [managerToDelete, setManagerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const tableRef = useRef<Table<ManagerRow> | null>(null);

  const columns = useMemo<ColumnDef<ManagerRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => (
          <span className="font-medium">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: (info) => info.getValue() || "-",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedManagerId(row.original.id);
                setEditDialogOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setManagerToDelete({
                  id: row.original.id,
                  name: row.original.name,
                });
                setDeleteDialogOpen(true);
              }}
            >
              <Trash className="size-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  const canReset =
    typeof window !== "undefined" && !!window.localStorage.getItem(storageKey);

  const filteredManagers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.email?.toLowerCase().includes(q) ?? false) ||
        (m.phone?.toLowerCase().includes(q) ?? false),
    );
  }, [managers, search]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search managers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
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
          <div className="">
            <CreateManagerDialog />
          </div>
        </div>
      </div>
      <DataTable
        data={filteredManagers}
        columns={columns}
        storageKey="managers-table"
        pageSize={10}
        tableRef={tableRef}
        lockColumns={["actions"]}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            No managers found.
          </div>
        }
      />
      <EditManagerDialog
        managerId={selectedManagerId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />
      <DeleteManagerDialog
        managerId={managerToDelete?.id ?? null}
        managerName={managerToDelete?.name}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setManagerToDelete(null);
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
