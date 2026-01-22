"use client";

import { useMemo, useState, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
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
  const size = Number.isInteger(k.size) ? String(k.size) : String(k.size);
  return `${size}${k.unit}`; // 20L, 5L, 25KG
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

// ---------- component ----------
export default function ProductsTable({
  products,
  suppliers: allSuppliers,
}: {
  products: ProductRow[];
  suppliers: Supplier[];
}) {
  const suppliers = useMemo(() => allSuppliers, [allSuppliers]);

  console.log(suppliers, "These are suppliers!");

  // Set default supplierId to Plascon if available
  const defaultSupplierId = useMemo(() => {
    const plascon = suppliers.find((s) => s.name.toLowerCase() === "plascon");
    return plascon ? plascon.id : suppliers[0]?.id || "";
  }, [suppliers]);

  // Set supplierId to defaultSupplierId only on first mount
  const [supplierId, setSupplierId] = useState<string>(() => defaultSupplierId);

  // Single useEffect to keep supplierId valid and set Plascon as default if suppliers change
  useEffect(() => {
    if (Array.isArray(suppliers) && suppliers?.length > 0) {
      // If supplierId is not in the list, set to Plascon or first supplier
      if (!suppliers?.some((s) => s.id === supplierId)) {
        setSupplierId(defaultSupplierId);
      }
    } else if (supplierId) {
      // If suppliers is empty, clear supplierId
      setSupplierId("");
    }
  }, [suppliers, supplierId, defaultSupplierId]);

  const [search, setSearch] = useState("");

  // keep selected supplier valid when data loads/refetches
  useEffect(() => {
    if (!suppliers?.length) return;
    if (!supplierId) setSupplierId(suppliers[0].id);
    const exists = suppliers?.some((s) => s.id === supplierId);
    if (!exists) setSupplierId(suppliers[0].id);
  }, [suppliers, supplierId]);

  const variantKeys = useMemo(() => {
    if (!supplierId) return [];
    return buildVariantKeysForSupplier(products, supplierId);
  }, [products, supplierId]);

  // Filter products by selected supplier and search query
  const filteredProducts = useMemo(() => {
    // If no supplier selected, show all products
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
      // Search by supplier name
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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Shortcut
          </span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-slate-100">
            {row.original.shortcut || "—"}
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

    // Action column
    const actionCol: ColumnDef<ProductRow> = {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* Replace with your actual action buttons/components */}
          <button
            className="px-2 py-1 text-xs rounded bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={() => alert(`Edit ${row.original.name}`)}
          >
            Edit
          </button>
          <button
            className="px-2 py-1 text-xs rounded bg-red-700 text-white hover:bg-red-800"
            onClick={() => alert(`Delete ${row.original.name}`)}
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

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="w-[260px]">
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="bg-slate-900 border-slate-800">
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

            <span className="hidden md:block text-xs text-slate-400">
              Showing prices for selected supplier
            </span>
          </div>

          {/* Right controls */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-[320px]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="bg-slate-900 border-slate-800"
              />
            </div>

            <CreateProductDialog />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded bg-slate-950 overflow-hidden">
        <DataTable
          data={filteredProducts}
          columns={columns}
          storageKey="products-table"
        />
      </div>
    </div>
  );
}
