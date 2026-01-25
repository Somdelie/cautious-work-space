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
import { ChevronDown, Columns3 } from "lucide-react";

type UsageType = "INTERNAL" | "EXTERNAL" | "BOTH";
type MeasureUnit = "L" | "KG" | "EA";

type Supplier = {
  id: string;
  name: string;
  logoUrl: string | null;
};

type ProductVariant = {
  id: string;
  size: number;
  unit: MeasureUnit;
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
  unit: MeasureUnit;
  perCoat: boolean;
};

export type ProductRow = {
  id: string;
  name: string;
  shortcut: string | null;
  usageType: UsageType;
  supplierProducts: SupplierProduct[];
  spreadRates: SpreadRate[];
};

// ---------- helpers ----------
type VariantKey = { size: number; unit: MeasureUnit };

function usageBadgeText(t: UsageType) {
  if (t === "BOTH") return "Ext/Int";
  if (t === "INTERNAL") return "Internal";
  return "External";
}

function usageBadgeStyle(t: UsageType) {
  if (t === "BOTH")
    return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
  if (t === "INTERNAL")
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
  return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
}

function keyToString(k: VariantKey) {
  return `${k.size}${k.unit}`;
}

function sortVariantKeys(a: VariantKey, b: VariantKey) {
  const unitOrder: Record<MeasureUnit, number> = { L: 0, KG: 1, EA: 2 };
  const ua = unitOrder[a.unit] ?? 9;
  const ub = unitOrder[b.unit] ?? 9;
  if (ua !== ub) return ua - ub;
  return a.size - b.size;
}

function buildVariantKeysForSupplier(
  products: ProductRow[],
  supplierId: string,
) {
  const map = new Map<string, VariantKey>();

  for (const p of products) {
    const sp = (p.supplierProducts || []).find(
      (x) => x.supplierId === supplierId && x.isActive,
    );
    if (!sp) continue;

    for (const v of sp.variants || []) {
      if (!v.isActive) continue;
      if (typeof v.price !== "number") continue;
      map.set(`${v.size}_${v.unit}`, { size: v.size, unit: v.unit });
    }
  }

  return Array.from(map.values()).sort(sortVariantKeys);
}

function findPrice(row: ProductRow, supplierId: string, k: VariantKey) {
  const sp = (row.supplierProducts || []).find(
    (x) => x.supplierId === supplierId && x.isActive,
  );
  if (!sp) return null;

  const v = (sp.variants || []).find(
    (x) => x.isActive && x.size === k.size && x.unit === k.unit,
  );
  if (!v) return null;

  return typeof v.price === "number" && v.price > 0 ? v.price : null;
}

function productColumnLabel(col: any) {
  if (col.id === "shortcut") return "Shortcut";
  if (col.id === "name") return "Product";
  if (col.id === "usageType") return "Usage";
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
  const suppliers = useMemo(() => allSuppliers, [allSuppliers]);

  // Column dropdown moved here
  const tableRef = useRef<Table<ProductRow> | null>(null);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);

  // ✅ only these appear in dropdown
  const columnAllowList = useMemo(() => ["shortcut", "name", "usageType"], []);
  const lockColumns = ["actions"];
  const storageKey = "products-table";

  // default supplier
  const defaultSupplierId = useMemo(() => {
    const plascon = suppliers.find((s) => s.name.toLowerCase() === "plascon");
    return plascon ? plascon.id : suppliers[0]?.id || "";
  }, [suppliers]);

  const [supplierId, setSupplierId] = useState<string>(() => defaultSupplierId);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (Array.isArray(suppliers) && suppliers.length > 0) {
      if (!suppliers.some((s) => s.id === supplierId)) {
        setSupplierId(defaultSupplierId);
      }
    } else if (supplierId) {
      setSupplierId("");
    }
  }, [suppliers, supplierId, defaultSupplierId]);

  useEffect(() => {
    if (!suppliers?.length) return;
    if (!supplierId) setSupplierId(suppliers[0].id);
    const exists = suppliers.some((s) => s.id === supplierId);
    if (!exists) setSupplierId(suppliers[0].id);
  }, [suppliers, supplierId]);

  const variantKeys = useMemo(() => {
    if (!supplierId) return [];
    return buildVariantKeysForSupplier(products, supplierId);
  }, [products, supplierId]);

  const filteredProducts = useMemo(() => {
    let filtered = supplierId
      ? products.filter((p) =>
          (p.supplierProducts || []).some((sp) => sp.supplierId === supplierId),
        )
      : products;

    const q = search.trim().toLowerCase();
    if (!q) return filtered;

    return filtered.filter((p) => {
      if (p.name?.toLowerCase().includes(q)) return true;
      if (p.shortcut?.toLowerCase().includes(q)) return true;
      if (
        (p.supplierProducts || []).some((sp) =>
          sp.supplier?.name?.toLowerCase().includes(q),
        )
      )
        return true;
      return false;
    });
  }, [products, supplierId, search]);

  const columns = useMemo<ColumnDef<ProductRow>[]>(() => {
    const base: ColumnDef<ProductRow>[] = [
      {
        accessorKey: "shortcut",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider ">
            Shortcut
          </span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-slate-100">
            {row.original.shortcut || "missing"}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Product
          </span>
        ),
        cell: ({ row }) => (
          <span
            className="block max-w-[360px] truncate text-slate-100"
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
            Usage
          </span>
        ),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${usageBadgeStyle(
              row.original.usageType,
            )}`}
          >
            {usageBadgeText(row.original.usageType)}
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
        if (!supplierId) return <span className="text-slate-500">—</span>;
        const price = findPrice(row.original, supplierId, k);
        return price ? (
          <span className="font-semibold text-emerald-400">
            {formatCurrency(price)}
          </span>
        ) : (
          ""
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
            onClick={() => alert(`Edit ${row.original.name}`)}
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
      <div className="">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="w-[260px]">
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="text-muted-foreground">
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* <span className="hidden md:block text-xs text-slate-400">
              Showing prices for selected supplier
            </span> */}
          </div>

          {/* Right controls */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-[320px]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className=""
              />
            </div>

            {/* Columns dropdown (ONLY main columns) */}
            <div className="flex items-center justify-end gap-2">
              <div className="relative">
                <button
                  onClick={() => setColumnsDropdownOpen(!columnsDropdownOpen)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded border border-slate-700 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
                  type="button"
                >
                  <Columns3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Columns</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>

                {columnsDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setColumnsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 z-50 rounded border border-slate-700 bg-slate-900 shadow-lg">
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
                                    isLocked
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
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
            </div>

            <div className="">
              {" "}
              <CreateProductDialog />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className=" overflow-hidden">
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
    </div>
  );
}
