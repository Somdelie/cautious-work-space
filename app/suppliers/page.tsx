"use client";

import { useState, useEffect } from "react";
import { getSuppliers } from "@/actions/supplier";
import { CreateSupplierDialog } from "@/components/dialogs/create-supplier";
import { EditSupplierDialog } from "@/components/dialogs/edit-supplier";
import { DeleteSupplierDialog } from "@/components/dialogs/delete-supplier";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Pencil, Trash, Package, Briefcase } from "lucide-react";
import Image from "next/image";

function SuppliersPage() {
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const result = await getSuppliers();
      if (result.success && result.data) {
        setSuppliersData(result.data);
      }
    };
    fetchSuppliers();
  }, []);

  return (
    <div className="max-h-[90vh] bg-slate-950/40 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
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
          <CreateSupplierDialog
            onSuccess={() => {
              // Refresh suppliers list
              getSuppliers().then((result) => {
                if (result.success && result.data) {
                  setSuppliersData(result.data);
                }
              });
            }}
          />
        </div>

        {/* Suppliers Grid */}
        {suppliersData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-slate-800/50 p-6 mb-4">
              <Package className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No suppliers yet
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Get started by creating your first supplier to manage jobs and
              projects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suppliersData.map((supplier) => (
              <Card
                key={supplier.id}
                className="group bg-linear-to-br from-slate-900 to-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    {supplier.logoUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-800/50">
                        <Image
                          src={supplier.logoUrl}
                          alt={supplier.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg bg-primary/10 p-2.5 ring-1 ring-primary/20">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                      <span className="text-xs font-medium text-slate-400">
                        {supplier.jobs.length}
                      </span>
                      <span className="text-xs text-slate-500">jobs</span>
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold text-white mb-1 line-clamp-2">
                    {supplier.name}
                  </CardTitle>

                  <p className="text-sm text-slate-400">
                    {supplier.jobs.length === 0
                      ? "No active jobs"
                      : `${supplier.jobs.length} active ${
                          supplier.jobs.length === 1 ? "job" : "jobs"
                        }`}
                  </p>
                </CardContent>

                <CardFooter className="p-3 pt-0 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
                    onClick={() => {
                      setSelectedSupplierId(supplier.id);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-slate-800/50 border-slate-700 hover:bg-red-950/50 hover:border-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
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
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EditSupplierDialog
        supplierId={selectedSupplierId}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedSupplierId(null);
          }
        }}
        onSuccess={() => {
          // Refresh suppliers list
          getSuppliers().then((result) => {
            if (result.success && result.data) {
              setSuppliersData(result.data);
            }
          });
        }}
      />

      <DeleteSupplierDialog
        supplierId={supplierToDelete?.id ?? null}
        supplierName={supplierToDelete?.name}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSupplierToDelete(null);
          }
        }}
        onSuccess={() => {
          // Refresh suppliers list
          getSuppliers().then((result) => {
            if (result.success && result.data) {
              setSuppliersData(result.data);
            }
          });
        }}
      />
    </div>
  );
}

export default SuppliersPage;
