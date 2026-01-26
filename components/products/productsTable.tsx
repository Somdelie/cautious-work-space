"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CreateProductDialog } from "../dialogs/create-product";
import { EditProductDialog } from "../dialogs/edit-product";
import { ChevronDown, Columns3 } from "lucide-react";

type UsageType = "INTERNAL" | "EXTERNAL" | "BOTH";

type Supplier = {
  id: string;
  name: string;
  logoUrl: string | null;
};

type ProductVariant = {
  id: string;
  size: number;
  unit: string;
  price: number;
  isActive: boolean;
};

type SupplierProduct = {
  supplierId: string;
  productId: string;
  isActive: boolean;
  supplier: Supplier;
  variants: ProductVariant[];
};

type SpreadRate = {
  id: string;
  consumption: number;
  unit: string;
  perCoat: boolean;
  notes: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  shortcut: string | null;
  usageType: UsageType;
  discountPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
  supplierProducts: SupplierProduct[];
  spreadRates: SpreadRate[];

  // ✅ NEW: reliable product unit display (from Product.unit.code)
  unitCode?: string;
};

// ---------- helpers ----------
type VariantKey = { size: number; unit: string };

function usageBadgeText(t: UsageType) {
  if (t === "BOTH") return "Ext/Int";
  if (t === "INTERNAL") return "Internal";
  return "External";
}

function usageBadgeStyle(t: UsageType) {
  if (t === "BOTH")
    return "bg-purple-200 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-400 dark:border-purple-800";
  if (t === "INTERNAL")
    return "bg-blue-200 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-400 dark:border-blue-800";
  return "bg-amber-200 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-400 dark:border-amber-800";
}

function keyToString(k: VariantKey) {
  return `${k.size}${k.unit}`;
}

function sortVariantKeys(a: VariantKey, b: VariantKey) {
  if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);
  return a.size - b.size;
}

function buildVariantKeysForSupplier(products: ProductRow[], supplierId: string) {
  const map = new Map<string, VariantKey>();

  for (const p of products) {
    const sp = (p.supplierProducts ?? []).find(
      (x) => x.supplierId === supplierId && x.isActive
    );
    if (!sp) continue;

    for (const v of sp.variants ?? []) {
      if (!v.isActive) continue;
      if (typeof v.price !== "number") continue;
      map.set(`${v.size}_${v.unit}`, { size: v.size, unit: v.unit });
    }
  }

  return Array.from(map.values()).sort(sortVariantKeys);
}

function findPrice(row: ProductRow, supplierId: string, k: VariantKey) {
  const sp = (row.supplierProducts ?? []).find(
    (x) => x.supplierId === supplierId && x.isActive
  );
  if (!sp) return null;

  const v = (sp.variants ?? []).find(
    (x) => x.isActive && x.size === k.size && x.unit === k.unit
  );
  if (!v) return null;

  return typeof v.price === "number" && v.price > 0 ? v.price : null;
}

function productColumnLabel(col: any) {
  if (col.id === "shortcut") return "Shortcut";
  if (col.id === "name") return "Product";
  if (col.id === "usageType") return "Usage";
  if (col.id === "unit") return "Unit";
  if (col.id === "discountPrice") return "Discount Price";
  if (col.id === "createdAt") return "Created";
  if (col.id === "updatedAt") return "Updated";
  if (col.id === "actions") return "Actions";
  return String(col.id ?? "Column");
}

export default function ProductsTable({
  products,
  suppliers: allSuppliers,
}: {
  products: ProductRow[];
  suppliers: Supplier[];
}) {
  const suppliers = useMemo(() => allSuppliers ?? [], [allSuppliers]);

  // ✅ "All suppliers" option so products never disappear
  const ALL = "__ALL__";

  // default supplier: plascon else first supplier else ALL
  const defaultSupplierId = useMemo(() => {
    const plascon = suppliers.find((s) => s.name.toLowerCase() === "plascon");
    if (plascon?.id) return plascon.id;
    return suppliers[0]?.id ?? ALL;
  }, [suppliers]);

  // ✅ clean supplierId init
  const [supplierId, setSupplierId] = useState<string>(ALL);
  useEffect(() => {
    setSupplierId(defaultSupplierId);
  }, [defaultSupplierId]);

  const [search, setSearch] = useState("");

  // Column dropdown
  const tableRef = useRef<Table<ProductRow> | null>(null);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);

  const columnAllowList = useMemo(
    () => ["shortcut", "name", "usageType", "unit", "discountPrice", "createdAt", "updatedAt"],
    []
  );
  const lockColumns = ["actions"];
  const storageKey = "products-table";

  const variantKeys = useMemo(() => {
    if (!supplierId || supplierId === ALL) return [];
    return buildVariantKeysForSupplier(products, supplierId);
  }, [products, supplierId]);

  // ✅ FIX: filtering no longer empties table when supplierProducts is empty
  const filteredProducts = useMemo(() => {
    let filtered = products ?? [];

    if (supplierId && supplierId !== ALL) {
      filtered = filtered.filter((p) => {
        const links = p.supplierProducts ?? [];

        // if product not linked to any supplier yet → still show it
        if (links.length === 0) return true;

        return links.some((sp) => sp.supplierId === supplierId && sp.isActive);
      });
    }

    const q = search.trim().toLowerCase();
    if (!q) return filtered;

    return filtered.filter((p) => {
      if (p.name?.toLowerCase().includes(q)) return true;
      if (p.shortcut?.toLowerCase().includes(q)) return true;
      if ((p.supplierProducts ?? []).some((sp) => sp.supplier?.name?.toLowerCase().includes(q)))
        return true;
      return false;
    });
  }, [products, supplierId, search]);

  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const columns = useMemo<ColumnDef<ProductRow>[]>(() => {
    const base: ColumnDef<ProductRow>[] = [
      {
        accessorKey: "shortcut",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Shortcut
          </span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.shortcut || "—"}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Product Name
          </span>
        ),
        cell: ({ row }) => (
          <span
            className="block max-w-[360px] truncate font-medium text-muted-foreground text-xs"
            title={row.original.name}
          >
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "usageType",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Usage Type
          </span>
        ),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${usageBadgeStyle(
              row.original.usageType
            )}`}
          >
            {usageBadgeText(row.original.usageType)}
          </span>
        ),
      },
      {
        id: "unit",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Unit
          </span>
        ),
        // ✅ FIX: show product unit code reliably
        cell: ({ row }) => (
          <span className="text-sm">{row.original.unitCode || "—"}</span>
        ),
      },
      {
        accessorKey: "discountPrice",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Discount Price
          </span>
        ),
        cell: ({ row }) =>
          row.original.discountPrice != null ? (
            <span className="text-sm font-medium text-emerald-400">
              {formatCurrency(row.original.discountPrice)}
            </span>
          ) : (
            <span className="text-slate-500">—</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Created At
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Updated At
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {row.original.updatedAt
              ? new Date(row.original.updatedAt).toLocaleDateString()
              : "—"}
          </span>
        ),
      },
    ];

    const variantCols: ColumnDef<ProductRow>[] = variantKeys.map((k) => ({
      id: `price_${k.size}_${k.unit}`,
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {keyToString(k)}
        </span>
      ),
      cell: ({ row }) => {
        if (!supplierId || supplierId === ALL) return <span className="text-slate-500">—</span>;
        const price = findPrice(row.original, supplierId, k);
        return price ? (
          <span className="font-semibold text-emerald-400 text-sm">
            {formatCurrency(price)}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        );
      },
    }));

    const actionCol: ColumnDef<ProductRow> = {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs rounded bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={() => {
              setEditProductId(row.original.id);
              setEditDialogOpen(true);
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="px-2 py-1 text-xs rounded bg-red-700 text-white hover:bg-red-800"
            onClick={() => alert(`Delete ${row.original.name}`)}
            type="button"
          >
            Delete
          </button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    };

    return [...base, ...variantCols, actionCol];
  }, [variantKeys, supplierId]);

  const canReset =
    typeof window !== "undefined" && !!window.localStorage.getItem(storageKey);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Supplier */}
        <div className="flex-1">
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="text-muted-foreground">
              <SelectValue placeholder="Select supplier..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All suppliers</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
          />
        </div>

        {/* Right side */}
        <div className="flex items-center justify-between gap-2">
          {/* Columns dropdown */}
          <div className="relative">
            <button
              onClick={() => setColumnsDropdownOpen(!columnsDropdownOpen)}
              className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded border border-slate-700 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
              type="button"
            >
              <Columns3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Columns</span>
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
                        .filter((c: any) => columnAllowList.includes(String(c.id)))
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
                                  if (!isLocked) col.toggleVisibility(e.target.checked);
                                }}
                                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600"
                              />
                              <span className="truncate capitalize text-slate-200">
                                {productColumnLabel(col)}
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

         <div className=""> <CreateProductDialog /></div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <DataTable<ProductRow>
          data={filteredProducts}
          columns={columns}
          storageKey={storageKey}
          tableRef={tableRef}
          showColumnToggle={false}
          lockColumns={lockColumns}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>

      <EditProductDialog
        productId={editProductId}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditProductId(null);
        }}
        onSuccess={() => {
          setEditDialogOpen(false);
          setEditProductId(null);
        }}
      />
    </div>
  );
}
