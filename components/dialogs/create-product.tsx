"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
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
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSuppliers } from "@/actions/supplier";
import { createProduct } from "@/actions/product"; // ✅ NEW action

type UsageType = "INTERNAL" | "EXTERNAL" | "BOTH";
type MeasureUnit = "L" | "KG" | "EA";

interface Supplier {
  id: string;
  name: string;
}

type VariantDraft = {
  size: string; // keep as string for input
  unit: MeasureUnit;
  price: string; // keep as string for input
};

interface CreateProductDialogProps {
  supplierId?: string;
  onSuccess?: () => void;
}

export function CreateProductDialog({
  supplierId,
  onSuccess,
}: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    supplierId ?? "",
  );

  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [usageType, setUsageType] = useState<UsageType>("BOTH");

  const [variants, setVariants] = useState<VariantDraft[]>([
    { size: "20", unit: "L", price: "" },
    { size: "5", unit: "L", price: "" },
  ]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const res = await getSuppliers();
      if (res.success && res.data) setSuppliers(res.data);
    };
    fetchSuppliers();
  }, []);

  // keep supplierId in sync when passed from a page
  useEffect(() => {
    if (supplierId) setSelectedSupplierId(supplierId);
  }, [supplierId]);

  const supplierOptions = useMemo(() => suppliers, [suppliers]);

  function resetForm() {
    setName("");
    setShortcut("");
    setUsageType("BOTH");
    setSelectedSupplierId(supplierId ?? "");
    setVariants([
      { size: "20", unit: "L", price: "" },
      { size: "5", unit: "L", price: "" },
    ]);
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, { size: "", unit: "L", price: "" }]);
  }

  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  }

  // Accepts a flag to keep dialog open for bulk add
  const handleSubmit = async (e: React.FormEvent, keepOpen = false) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }

    // sanitize variants: only keep rows with a valid size + price
    const cleanVariants = variants
      .map((v) => {
        const size = Number(v.size);
        const price = Number(v.price);

        if (!Number.isFinite(size) || size <= 0) return null;
        if (!Number.isFinite(price) || price <= 0) return null;

        return { size, unit: v.unit, price };
      })
      .filter(Boolean) as Array<{
      size: number;
      unit: MeasureUnit;
      price: number;
    }>;

    if (cleanVariants.length === 0) {
      toast.error("Add at least one valid variant (size + price)");
      return;
    }

    setLoading(true);
    try {
      const res = await createProduct({
        name: name.trim(),
        shortcut: shortcut.trim() || null,
        usageType,
        supplierId: selectedSupplierId,
        variants: cleanVariants,
      });

      if (!res.success) {
        toast.error(
          typeof res.error === "string"
            ? res.error
            : "Failed to create product",
        );
        return;
      }

      toast.success("Product created");
      resetForm();
      if (!keepOpen) {
        setOpen(false);
        onSuccess?.();
      } else {
        // Optionally call onSuccess for live update
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-none w-full">
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
          <DialogDescription>
            Create a product, link it to a supplier, then add priced variants
            (e.g. 20L, 5L, 25KG).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => handleSubmit(e, false)}
          className="space-y-4 max-h-[75vh] overflow-y-auto pr-2"
        >
          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier *</Label>
            <Select
              value={selectedSupplierId}
              onValueChange={setSelectedSupplierId}
              disabled={loading}
            >
              <SelectTrigger
                id="supplier"
                className="bg-slate-900 border-slate-800"
              >
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {supplierOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product core */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shortcut">Shortcut</Label>
              <Input
                id="shortcut"
                placeholder="e.g. PGS1"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage">Usage</Label>
              <Select
                value={usageType}
                onValueChange={(v) => setUsageType(v as UsageType)}
                disabled={loading}
              >
                <SelectTrigger
                  id="usage"
                  className="bg-slate-900 border-slate-800"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXTERNAL">External</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Professional Elastoshield"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Variants */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Variants & Prices
                </p>
                <p className="text-xs text-slate-400">
                  Add sizes like 20L / 5L / 25KG, each with a price.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addVariantRow}
                disabled={loading}
              >
                + Add variant
              </Button>
            </div>

            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs text-slate-400">Size</Label>
                    <Input
                      value={v.size}
                      onChange={(e) =>
                        updateVariant(idx, { size: e.target.value })
                      }
                      placeholder="20"
                      disabled={loading}
                      inputMode="decimal"
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs text-slate-400">Unit</Label>
                    <Select
                      value={v.unit}
                      onValueChange={(u) =>
                        updateVariant(idx, { unit: u as MeasureUnit })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="EA">EA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4">
                    <Label className="text-xs text-slate-400">Price</Label>
                    <Input
                      value={v.price}
                      onChange={(e) =>
                        updateVariant(idx, { price: e.target.value })
                      }
                      placeholder="792.38"
                      disabled={loading}
                      inputMode="decimal"
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariantRow(idx)}
                      disabled={loading || variants.length <= 1}
                      className="text-red-400 hover:text-red-300"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              className="gap-2"
              onClick={(e) => handleSubmit(e as any, true)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create & Add Another
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
