"use client";
import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EditProductTypeDialog } from "@/components/dialogs/edit-product-type";
import { DeleteProductTypeDialog } from "@/components/dialogs/delete-product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateProductTypeDialog } from "@/components/dialogs/create-product";

type ProductType = {
  id: string;
  type: string;
  shortcut: string | null;
  supplierId: string;
  usageType?: "INTERNAL" | "EXTERNAL" | "BOTH";
  price5L?: number;
  price20L?: number;
  price?: number;
};

type Supplier = {
  id: string;
  name: string;
  logoUrl: string | null;
};

type ProductTypeWithSupplier = ProductType & {
  supplier: Supplier;
};

type SortKey = keyof ProductTypeWithSupplier | "supplierName";

function displayUsageTypeShort(usageType?: string) {
  if (!usageType) return null;
  if (usageType === "BOTH") return "Ext/Int";
  if (usageType === "INTERNAL") return "Int";
  if (usageType === "EXTERNAL") return "Ext";
  return usageType;
}

export default function ProductTypesTable({
  productTypes,
}: {
  productTypes: ProductTypeWithSupplier[];
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<
    string | null
  >(null);
  const [productTypeToDelete, setProductTypeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const columns = useMemo<ColumnDef<ProductTypeWithSupplier>[]>(
    () => [
      {
        accessorKey: "shortcut",
        header: () => <span className="font-semibold">Shortcut</span>,
        cell: ({ row }) => row.original.shortcut || "-",
      },
      {
        accessorKey: "type",
        header: () => <span className="font-semibold">Name</span>,
        cell: ({ row }) => (
          <span
            className="block max-w-[220px] truncate"
            title={row.original.type}
          >
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "supplier.name",
        header: () => <span className="font-semibold">Supplier</span>,
        cell: ({ row }) => row.original.supplier?.name || "-",
      },
      {
        id: "usageType",
        header: () => <span className="font-semibold">Ext/Int</span>,
        cell: ({ row }) =>
          displayUsageTypeShort(row.original.usageType) ? (
            <span className="inline-flex items-center rounded-full bg-blue-100/80 dark:bg-blue-900/50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 backdrop-blur-sm">
              {displayUsageTypeShort(row.original.usageType)}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        id: "price20L",
        header: () => <span className="font-semibold">Price 20L</span>,
        cell: ({ row }) =>
          typeof row.original.price20L === "number" &&
          row.original.price20L !== 0 ? (
            <span className="font-semibold text-base text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">
              ${row.original.price20L.toFixed(2)}
            </span>
          ) : typeof row.original.price === "number" &&
            row.original.price !== 0 ? (
            <span className="font-semibold text-base text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">
              ${row.original.price.toFixed(2)}
            </span>
          ) : (
            <span className="text-red-500 italic">Missing</span>
          ),
      },
      {
        id: "price5L",
        header: () => <span className="font-semibold">Price 5L</span>,
        cell: ({ row }) =>
          typeof row.original.price5L === "number" &&
          row.original.price5L !== 0 ? (
            <span className="font-semibold text-base text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">
              ${row.original.price5L.toFixed(2)}
            </span>
          ) : (
            <span className="text-red-500 italic">Missing</span>
          ),
      },
      {
        id: "actions",
        header: () => <span className="font-semibold">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 px-2 py-1 rounded">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
              onClick={() => {
                setSelectedProductTypeId(row.original.id);
                setEditDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
              onClick={() => {
                setProductTypeToDelete({
                  id: row.original.id,
                  name: row.original.type,
                });
                setDeleteDialogOpen(true);
              }}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        data={productTypes}
        columns={columns}
        globalFilterPlaceholder="Search product types..."
      />
      <EditProductTypeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        productTypeId={selectedProductTypeId}
        onSuccess={async () => {
          setEditDialogOpen(false);
        }}
      />
      <DeleteProductTypeDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setProductTypeToDelete(null);
          }
        }}
        productTypeId={productTypeToDelete?.id}
        productTypeName={productTypeToDelete?.name}
        onSuccess={async () => {
          setDeleteDialogOpen(false);
        }}
      />
    </>
  );
}
