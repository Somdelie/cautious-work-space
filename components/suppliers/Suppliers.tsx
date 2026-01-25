"use client";

import { useState } from "react";
import { getSuppliers } from "@/actions/supplier";
import { CreateSupplierDialog } from "@/components/dialogs/create-supplier";
import { EditSupplierDialog } from "@/components/dialogs/edit-supplier";
import { DeleteSupplierDialog } from "@/components/dialogs/delete-supplier";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, Trash, Package, Briefcase } from "lucide-react";
import Image from "next/image";

type Supplier = {
  id: string;
  name: string;
  logoUrl: string | null;
  jobsCount: number;
};

export default function SuppliersClient({
  initialSuppliers,
}: {
  initialSuppliers: Supplier[];
}) {
  const [suppliersData, setSuppliersData] =
    useState<Supplier[]>(initialSuppliers);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null,
  );
  const [supplierToDelete, setSupplierToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const refreshSuppliers = async () => {
    const result = await getSuppliers();
    if (result.success && result.data) {
      setSuppliersData(result.data);
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Suppliers
            </h1>
            <p className="text-slate-400 mt-1">
              {suppliersData.length}{" "}
              {suppliersData.length === 1 ? "supplier" : "suppliers"} registered
            </p>
          </div>

          <div className="">
            {" "}
            <CreateSupplierDialog onSuccess={refreshSuppliers} />
          </div>
        </div>

        {/* Empty state */}
        {suppliersData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-slate-800/50 p-6 mb-4">
              <Package className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No suppliers yet
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Create your first supplier to start managing jobs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {suppliersData.map((supplier) => (
              <Card
                key={supplier.id}
                className=" gap-0 py-0 transition-all duration-200 overflow-hidden border"
              >
                {/* Image Header */}
                <div className="relative h-32 bg-sky-900 overflow-hidden">
                  {supplier.logoUrl ? (
                    <Image
                      width={200}
                      height={200}
                      src={supplier.logoUrl}
                      alt={supplier.name}
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-slate-800">
                      <Briefcase className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground truncate mb-2">
                    {supplier.name}
                  </h3>
                  <span className="inline-block text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {supplier.jobsCount}{" "}
                    {supplier.jobsCount === 1 ? "job" : "jobs"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-3 pt-0">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      setSelectedSupplierId(supplier.id);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      setSupplierToDelete({
                        id: supplier.id,
                        name: supplier.name,
                      });
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EditSupplierDialog
        supplierId={selectedSupplierId}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedSupplierId(null);
        }}
        onSuccess={refreshSuppliers}
      />

      <DeleteSupplierDialog
        supplierId={supplierToDelete?.id ?? null}
        supplierName={supplierToDelete?.name}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSupplierToDelete(null);
        }}
        onSuccess={refreshSuppliers}
      />
    </div>
  );
}
