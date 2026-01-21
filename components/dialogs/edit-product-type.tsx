/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from "lucide-react";
import { getSuppliers } from "@/actions/supplier";
import { toast } from "sonner";
import { updateProductType, getProductTypeById } from "@/actions/product-type";

interface EditProductTypeDialogProps {
  productTypeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Supplier {
  id: string;
  name: string;
}

export function EditProductTypeDialog({
  productTypeId,
  open,
  onOpenChange,
  onSuccess,
}: EditProductTypeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProductType, setLoadingProductType] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [type, setType] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [usage, setUsage] = useState<string>("");
  const [price5L, setPrice5L] = useState(0);
  const [price20L, setPrice20L] = useState(0);

  // Load suppliers when dialog opens
  useEffect(() => {
    const fetchSuppliers = async () => {
      const result = await getSuppliers();
      if (result.success && result.data) {
        setSuppliers(result.data);
      }
    };

    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  // Load product type data when productTypeId changes
  useEffect(() => {
    const fetchProductType = async () => {
      if (!productTypeId || !open) {
        return;
      }

      setLoadingProductType(true);
      try {
        const result = await getProductTypeById(productTypeId);
        if (result.success && result.data) {
          const productType = result.data;
          setType(productType.type);
          setShortcut(productType.shortcut || "");
          setSelectedSupplierId(productType.supplierId);
          // Map backend usageType to UI value
          if (productType.usageType === "INTERNAL") setUsage("internal");
          else if (productType.usageType === "EXTERNAL") setUsage("external");
          else setUsage("both");
          setPrice5L(productType.price5L ?? 0);
          setPrice20L(productType.price20L ?? productType.price ?? 0);
        } else {
          toast.error("Failed to load product type data");
          onOpenChange(false);
        }
      } catch (error) {
        toast.error("Failed to load product type data");
        onOpenChange(false);
      } finally {
        setLoadingProductType(false);
      }
    };

    fetchProductType();
  }, [productTypeId, open, onOpenChange]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setType("");
      setShortcut("");
      setSelectedSupplierId("");
      setUsage("");
      setPrice5L(0);
      setPrice20L(0);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productTypeId) return;

    if (!type.trim()) {
      toast.error("Please enter a product type");
      return;
    }
    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }
    // Map UI value to backend value
    let usageType: "INTERNAL" | "EXTERNAL" | "BOTH" | undefined;
    if (usage === "internal") usageType = "INTERNAL";
    else if (usage === "external") usageType = "EXTERNAL";
    else if (usage === "both") usageType = "BOTH";
    else usageType = undefined;

    setLoading(true);
    try {
      const result = await updateProductType(productTypeId, {
        type,
        shortcut: shortcut || undefined,
        supplierId: selectedSupplierId,
        usageType,
        price5L,
        price20L,
      });

      if (result.success) {
        toast.success("Product type updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update product type");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product Type</DialogTitle>
          <DialogDescription>Update product type information</DialogDescription>
        </DialogHeader>

        {loadingProductType ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 max-h-[70vh] overflow-y-auto pb-4 pr-2"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-product-type">Product Type *</Label>
              <Input
                id="edit-product-type"
                placeholder="e.g., Concrete, Steel, Lumber"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-shortcut">Shortcut</Label>
              <Input
                id="edit-shortcut"
                placeholder="e.g., CONC, STL, LUMB"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier-select">Supplier *</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger id="edit-supplier-select" disabled={loading}>
                  <SelectValue placeholder="Select a supplier" />
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
            <div className="space-y-2">
              <Label htmlFor="edit-usage-select">Product Usage</Label>
              <Select value={usage} onValueChange={setUsage} disabled={loading}>
                <SelectTrigger id="edit-usage-select">
                  <SelectValue placeholder="Select usage (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price20L">Price per 20 Litres</Label>
              <Input
                id="edit-price20L"
                type="number"
                min={0}
                step={0.01}
                value={price20L}
                onChange={(e) => setPrice20L(parseFloat(e.target.value) || 0)}
                disabled={loading}
                placeholder="e.g., 100.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price5L">Price per 5 Litres</Label>
              <Input
                id="edit-price5L"
                type="number"
                min={0}
                step={0.01}
                value={price5L}
                onChange={(e) => setPrice5L(parseFloat(e.target.value) || 0)}
                disabled={loading}
                placeholder="e.g., 30.00"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Product Type
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
