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
import { getUnits } from "@/actions/unit";

// ✅ NEW schema actions (Unit + Option + supplier price)
import { createProduct } from "@/actions/product";
import { addOptionToProduct, createProductOption, setSupplierPriceForProductOption } from "@/actions/variant";


type UsageType = "INTERNAL" | "EXTERNAL" | "BOTH";

interface Supplier {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  code: string;
  name: string;
}

/**
 * NEW schema meaning:
 * - value + unitCode => ProductOption (global)
 * - attach option to product => ProductProductOption (join) => productOptionId
 * - set supplier price for productOptionId => SupplierVariantPrice
 */
type OptionDraft = {
  value: string; // input string
  unitId: string; // selected unit ID
  label: string; // optional display label
  price: string; // supplier price for that option
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    supplierId ?? "",
  );

  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [usageType, setUsageType] = useState<UsageType>("BOTH");
  const [productUnitId, setProductUnitId] = useState("");
  const [discountPrice, setDiscountPrice] = useState<string>("");

  // ✅ options/prices for supplier (replaces old variants array)
  const [options, setOptions] = useState<OptionDraft[]>([
    { value: "24", unitId: "", label: "", price: "" },
    { value: "36", unitId: "", label: "", price: "" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const [suppliersRes, unitsRes] = await Promise.all([
        getSuppliers(),
        getUnits(),
      ]);
      
      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data);
      }
      
      if (unitsRes.success && unitsRes.data) {
        setUnits(unitsRes.data);
        // Set default unit to first unit (usually MM)
        if (unitsRes.data.length > 0) {
          const defaultUnitId = unitsRes.data[0].id;
          setProductUnitId(defaultUnitId);
          setOptions(prev => prev.map(opt => ({ ...opt, unitId: defaultUnitId })));
        }
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (supplierId) setSelectedSupplierId(supplierId);
  }, [supplierId]);

  const supplierOptions = useMemo(() => suppliers, [suppliers]);
  const unitOptions = useMemo(() => units, [units]);

  function resetForm() {
    setName("");
    setShortcut("");
    setUsageType("BOTH");
    setSelectedSupplierId(supplierId ?? "");
    const defaultUnitId = units.length > 0 ? units[0].id : "";
    setProductUnitId(defaultUnitId);
    setOptions([
      { value: "24", unitId: defaultUnitId, label: "", price: "" },
      { value: "36", unitId: defaultUnitId, label: "", price: "" },
    ]);
  }

  function addRow() {
    const defaultUnitId = units.length > 0 ? units[0].id : "";
    setOptions((prev) => [...prev, { value: "", unitId: defaultUnitId, label: "", price: "" }]);
  }

  function removeRow(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<OptionDraft>) {
    setOptions((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  }

  // Accepts a flag to keep dialog open for bulk add
  const handleSubmit = async (keepOpen = false) => {
    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (!productUnitId) {
      toast.error("Please select a product unit");
      return;
    }

    // sanitize option rows: need (value + unitId + price)
    const clean = options
      .map((o) => {
        const value = Number(o.value);
        const unitId = o.unitId?.trim();
        const price = Number(o.price);
        const label = o.label?.trim() || null;

        if (!Number.isFinite(value) || value <= 0) return null;
        if (!unitId) return null;
        if (!Number.isFinite(price) || price <= 0) return null;

        return { value, unitId, price, label };
      })
      .filter(Boolean) as Array<{
      value: number;
      unitId: string;
      price: number;
      label: string | null;
    }>;

    if (clean.length === 0) {
      toast.error("Add at least one valid option (value + unit + price)");
      return;
    }

    setLoading(true);
    try {
      // 1) create product
      const pRes = await createProduct({
        name: name.trim(),
        shortcut: shortcut.trim() || null,
        usageType,
        unitId: productUnitId,
        discountPrice: discountPrice !== "" ? Number(discountPrice) : undefined,
      });

      if (!pRes.success || !pRes.data) {
        if (typeof pRes.error === "string") {
          toast.error(pRes.error);
        } else {
          toast.error(pRes.error?.message || "Failed to create product❗");
        }
        return;
      }

      const productId = pRes.data.id;

      // 2) for each option:
      // - ensure ProductOption (global) exists
      // - attach to product (join id = productOptionId)
      // - set supplier price for that productOptionId
      for (const row of clean) {
        // ensure global option
        const unit = units.find(u => u.id === row.unitId);
        const optRes = await createProductOption({
          value: row.value,
          unitCode: unit?.code || "",
          unitName: unit?.name || null,
          label: row.label,
        });

        if (!optRes.success || !optRes.data) {
          toast.error(optRes.error || `Failed to create option ${row.value}`);
          continue;
        }

        // attach option to product (returns join id)
        const attachRes = await addOptionToProduct({
          productId,
          optionId: optRes.data.id,
        });

        if (!attachRes.success || !attachRes.data) {
          const unitCode = units.find(u => u.id === row.unitId)?.code || '';
          toast.error(attachRes.error || `Failed to attach ${row.value}${unitCode} to product`);
          continue;
        }

        const productOptionId = attachRes.data.id;

        // set supplier-specific price
        const priceRes = await setSupplierPriceForProductOption({
          supplierId: selectedSupplierId,
          productId,
          productOptionId,
          unitPrice: row.price,
          isActive: true,
        });

        if (!priceRes.success) {
          const unitCode = units.find(u => u.id === row.unitId)?.code || '';
          toast.error(priceRes.error || `Failed to set price for ${row.value}${unitCode}`);
        }
      }

      toast.success(`product "${pRes.data.name}" created successfully`);
      resetForm();
      setDiscountPrice("");
      onSuccess?.();
      if (!keepOpen) {
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Unexpected error");
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

      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
          <DialogDescription>
            Create a product, choose a supplier, then add options (e.g. 24MM, 36MM)
            with supplier prices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
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
                placeholder="e.g. MT"
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
              placeholder="e.g. Masking Tape"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productUnit">Product Unit *</Label>
              <Select
                value={productUnitId}
                onValueChange={setProductUnitId}
                disabled={loading}
              >
                <SelectTrigger
                  id="productUnit"
                  className="bg-slate-900 border-slate-800"
                >
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPrice">Discount Price</Label>
              <Input
                id="discountPrice"
                placeholder="e.g. 19.99"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                disabled={loading}
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Options + supplier prices */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Options & Supplier Prices
                </p>
                <p className="text-xs text-slate-400">
                  Add option value + unit (like 24MM) and the supplier price.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addRow}
                disabled={loading}
              >
                + Add option
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((o, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Label className="text-xs text-slate-400">Value</Label>
                    <Input
                      value={o.value}
                      onChange={(e) => updateRow(idx, { value: e.target.value })}
                      placeholder="24"
                      disabled={loading}
                      inputMode="decimal"
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs text-slate-400">Unit</Label>
                    <Select
                      value={o.unitId}
                      onValueChange={(unitId) => updateRow(idx, { unitId })}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-800">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs text-slate-400">Label (optional)</Label>
                    <Input
                      value={o.label}
                      onChange={(e) => updateRow(idx, { label: e.target.value })}
                      placeholder="24mm"
                      disabled={loading}
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs text-slate-400">Price</Label>
                    <Input
                      value={o.price}
                      onChange={(e) => updateRow(idx, { price: e.target.value })}
                      placeholder="39.99"
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
                      onClick={() => removeRow(idx)}
                      disabled={loading || options.length <= 1}
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
              onClick={() => handleSubmit(true)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create & Add Another
            </Button>
            <Button 
              type="button" 
              disabled={loading} 
              className="gap-2"
              onClick={() => handleSubmit(false)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}