"use client";

import { useState } from "react";
import { getSuppliers } from "@/actions/supplier";
import { CreateSupplierDialog } from "@/components/dialogs/create-supplier";
import { EditSupplierDialog } from "@/components/dialogs/edit-supplier";
import { DeleteSupplierDialog } from "@/components/dialogs/delete-supplier";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Pencil, Trash, Package, Briefcase } from "lucide-react";
import Image from "next/image";

type Supplier = any;

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
    <div className="max-h-[90vh] bg-slate-950/40 overflow-y-auto">
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

          <CreateSupplierDialog onSuccess={refreshSuppliers} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suppliersData.map((supplier) => (
              <Card
                key={supplier.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    {supplier.logoUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700">
                        <Image
                          src={supplier.logoUrl}
                          alt={supplier.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                    )}

                    <span className="text-xs text-slate-400">
                      {supplier.jobs.length} jobs
                    </span>
                  </div>

                  <CardTitle className="text-lg font-semibold text-white">
                    {supplier.name}
                  </CardTitle>
                </CardContent>

                <CardFooter className="flex gap-2 p-3 pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedSupplierId(supplier.id);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 hover:bg-red-950/40"
                    onClick={() => {
                      setSupplierToDelete({
                        id: supplier.id,
                        name: supplier.name,
                      });
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </CardFooter>
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
