"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createJob } from "@/actions/job";
import { getManagers } from "@/actions/manager";
import { getSuppliers } from "@/actions/supplier";
import { getProductTypes } from "@/actions/product-type";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateJobDialogProps {
  onSuccess?: () => void;
}

interface Manager {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductType {
  id: string;
  type: string;
}

export function CreateJobDialog({ onSuccess }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<string[]>([]);
  const [jobNumber, setJobNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [managersResult, suppliersResult] = await Promise.all([
        getManagers(),
        getSuppliers(),
      ]);

      if (managersResult.success && managersResult.data) {
        setManagers(managersResult.data);
      }
      if (suppliersResult.success && suppliersResult.data) {
        setSuppliers(suppliersResult.data);
      }
    };

    if (open) {
      fetchData();
    } else {
      // Reset form when dialog closes
      setJobNumber("");
      setSiteName("");
      setManagerId("");
      setSupplierId("");
      setSelectedProductTypeIds([]);
      setProductTypes([]);
    }
  }, [open]);

  useEffect(() => {
    const fetchProductTypes = async () => {
      if (supplierId) {
        const result = await getProductTypes(supplierId);
        if (result.success && result.data) {
          setProductTypes(result.data);
        }
      } else {
        setProductTypes([]);
      }
      // Reset selected product types when supplier changes
      setSelectedProductTypeIds([]);
    };

    fetchProductTypes();
  }, [supplierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobNumber.trim()) {
      toast.error("Please enter a job number");
      return;
    }

    if (!siteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    if (!managerId) {
      toast.error("Please select a manager");
      return;
    }

    if (!supplierId) {
      toast("Please select a supplier");
      return;
    }

    setLoading(true);
    try {
      const result = await createJob({
        jobNumber,
        siteName,
        managerId,
        supplierId,
        productTypeIds: selectedProductTypeIds.length > 0 ? selectedProductTypeIds : undefined,
      });

      if (result.success) {
        toast.success("Job created successfully");
        setJobNumber("");
        setSiteName("");
        setManagerId("");
        setSupplierId("");
        setSelectedProductTypeIds([]);
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create job");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Create a new job and assign it to a manager and supplier
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-number">Job Number *</Label>
              <Input
                id="job-number"
                placeholder="e.g., JOB-001"
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name *</Label>
              <Input
                id="site-name"
                placeholder="e.g., Downtown Project"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager-select">Manager *</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger id="manager-select" disabled={loading}>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-select">Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="supplier-select" disabled={loading}>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {supplierId && (
            <div className="space-y-3">
              <Label>Product Types</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-3">
                {productTypes.length > 0 ? (
                  productTypes.map((productType) => (
                    <div key={productType.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-type-${productType.id}`}
                        checked={selectedProductTypeIds.includes(productType.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProductTypeIds([...selectedProductTypeIds, productType.id]);
                          } else {
                            setSelectedProductTypeIds(
                              selectedProductTypeIds.filter((id) => id !== productType.id)
                            );
                          }
                        }}
                        disabled={loading}
                      />
                      <Label
                        htmlFor={`product-type-${productType.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {productType.type}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No product types available for this supplier
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
