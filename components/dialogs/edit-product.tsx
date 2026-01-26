/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getSuppliers } from "@/actions/supplier";
import {
  getProductById,
  updateProduct,
  upsertSupplierProduct,
  upsertVariant,
  deleteVariant,
} from "@/actions/product";

type UsageType = "INTERNAL" | "EXTERNAL" | "BOTH";

// ✅ FIX: unit codes are dynamic in your schema (Unit.code), so use string
type UnitCode = string;

type Supplier = { id: string; name: string; logoUrl?: string | null };

type Variant = {
  id: string;
  size: number;
  unit: UnitCode;
  price: number;
  sku: string | null;
  isActive: boolean;
};

type SupplierProduct = {
  supplierId: string;
  isActive: boolean;
  supplier: Supplier;
  variants: Variant[];
};

type Product = {
  id: string;
  name: string;
  shortcut: string | null;
  usageType: UsageType;
  supplierProducts: SupplierProduct[];
};

interface EditProductDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function usageToUi(u: UsageType) {
  if (u === "INTERNAL") return "internal";
  if (u === "EXTERNAL") return "external";
  return "both";
}
function uiToUsage(v: string): UsageType {
  if (v === "internal") return "INTERNAL";
  if (v === "external") return "EXTERNAL";
  return "BOTH";
}

function normalizeNumber(n: string) {
  const v = Number(String(n).replace(",", "."));
  return Number.isFinite(v) ? v : 0;
}

/** ---------------- Variants child types ---------------- */
type VariantSavePayload = {
  id?: string;
  supplierId: string;
  productId: string;
  size: number;
  unit: UnitCode;
  price: number;
  sku?: string | null;
  isActive: boolean;
};

type VariantsPanelProps = {
  productId: string;
  supplierId: string;
  variants: Variant[];
  disabled: boolean;
  onSave: (payload: VariantSavePayload) => Promise<void>;
  onDelete: (variantId: string) => Promise<void>;
  // optional unit list if you want it dynamic later
  unitOptions?: UnitCode[];
};

export function EditProductDialog({
  productId,
  open,
  onOpenChange,
  onSuccess,
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // product fields
  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [usage, setUsage] = useState<string>("both");

  // supplier+variants editing scope
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  // local copy for UI edits
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>(
    [],
  );

  const selectedSP = useMemo(() => {
    return (
      supplierProducts.find((sp) => sp.supplierId === selectedSupplierId) ??
      null
    );
  }, [supplierProducts, selectedSupplierId]);

  // load suppliers when open
  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await getSuppliers();
      if (res.success && res.data) setSuppliers(res.data);
    })();
  }, [open]);

  // load product
  useEffect(() => {
    if (!open || !productId) return;

    (async () => {
      setLoadingProduct(true);
      try {
        const res = await getProductById(productId);
        if (!res.success || !res.data) {
          toast.error("Failed to load product");
          onOpenChange(false);
          return;
        }

        // Ensure numeric prices
        const p: Product = {
          ...res.data,
          supplierProducts: (res.data.supplierProducts ?? []).map((sp: any) => ({
            ...sp,
            variants: (sp.variants ?? []).map((v: any) => ({
              ...v,
              price: Number(v.price ?? 0),
              unit: String(v.unit ?? v.productOption?.option?.unit?.code ?? ""),
              size: Number(v.size ?? v.productOption?.option?.value ?? 0),
              sku: v.sku ?? null,
              isActive: Boolean(v.isActive),
            })),
          })),
        };

        setName(p.name ?? "");
        setShortcut(p.shortcut ?? "");
        setUsage(usageToUi(p.usageType ?? "BOTH"));

        const sps = p.supplierProducts ?? [];
        setSupplierProducts(sps);

        const firstActive = sps.find((x) => x.isActive) ?? sps[0] ?? null;
        setSelectedSupplierId(firstActive?.supplierId ?? "");
      } catch {
        toast.error("Failed to load product");
        onOpenChange(false);
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [open, productId, onOpenChange]);

  // reset on close
  useEffect(() => {
    if (!open) {
      setName("");
      setShortcut("");
      setUsage("both");
      setSelectedSupplierId("");
      setSupplierProducts([]);
      setLoading(false);
      setLoadingProduct(false);
    }
  }, [open]);

  const handleToggleSupplier = async (supplierId: string, checked: boolean) => {
    if (!productId) return;

    // optimistic update
    setSupplierProducts((prev) => {
      const exists = prev.find((x) => x.supplierId === supplierId);
      if (!exists) {
        const sup = suppliers.find((s) => s.id === supplierId);
        if (!sup) return prev;
        return [
          ...prev,
          {
            supplierId,
            isActive: checked,
            supplier: sup,
            variants: [],
          },
        ];
      }
      return prev.map((x) =>
        x.supplierId === supplierId ? { ...x, isActive: checked } : x,
      );
    });

    try {
      const res = await upsertSupplierProduct({
        supplierId,
        productId,
        isActive: checked,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update supplier link");
      } else {
        toast.success(checked ? "Supplier linked" : "Supplier disabled");
        if (checked) setSelectedSupplierId(supplierId);
        if (!checked && selectedSupplierId === supplierId) {
          // switch selection to another active supplier if current was disabled
          const next = supplierProducts.find(
            (sp) => sp.supplierId !== supplierId && sp.isActive,
          );
          setSelectedSupplierId(next?.supplierId ?? "");
        }
      }
    } catch {
      toast.error("Failed to update supplier link");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await updateProduct(productId, {
        name: name.trim(),
        shortcut: shortcut.trim() || null,
        usageType: uiToUsage(usage),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update product");
        return;
      }

      toast.success("Product updated");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpsertVariant = async (payload: VariantSavePayload) => {
    try {
      const res = await upsertVariant(payload);
      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to save variant");
        return;
      }

      const saved: Variant = {
        id: String(res.data.id ?? payload.id ?? ""),
        size: Number(res.data.size ?? payload.size),
        unit: String(res.data.unit ?? payload.unit),
        price: Number(res.data.price ?? payload.price),
        sku: res.data.sku ?? payload.sku ?? null,
        isActive: Boolean(res.data.isActive ?? payload.isActive),
      };

      setSupplierProducts((prev) =>
        prev.map((sp) => {
          if (sp.supplierId !== payload.supplierId) return sp;

          const exists = sp.variants.find((v) => v.id === saved.id);
          const nextVariants = exists
            ? sp.variants.map((v) => (v.id === saved.id ? saved : v))
            : [saved, ...sp.variants];

          return { ...sp, variants: nextVariants };
        }),
      );

      toast.success("Variant saved");
    } catch {
      toast.error("Failed to save variant");
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      const res = await deleteVariant(variantId);
      if (!res.success) {
        toast.error(res.error || "Failed to delete variant");
        return;
      }

      setSupplierProducts((prev) =>
        prev.map((sp) => ({
          ...sp,
          variants: sp.variants.filter((v) => v.id !== variantId),
        })),
      );

      toast.success("Variant deleted");
    } catch {
      toast.error("Failed to delete variant");
    }
  };

  // ✅ choose unit options (static for now, can be dynamic later)
  const unitOptions: UnitCode[] = ["L", "KG", "EA", "MM", "PACK", "ROLL"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details, supplier links, and supplier-specific
            variants (sizes & prices).
          </DialogDescription>
        </DialogHeader>

        {loadingProduct ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={handleSaveProduct}
            className="space-y-6 max-h-[70vh] overflow-y-auto pr-2"
          >
            {/* Product core */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Product Name *</Label>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., PGS1 / UC2 WOOD PRIMER"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-shortcut">Shortcut</Label>
                <Input
                  id="p-shortcut"
                  value={shortcut}
                  onChange={(e) => setShortcut(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., PGS1"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-usage">Usage</Label>
                <Select
                  value={usage}
                  onValueChange={setUsage}
                  disabled={loading}
                >
                  <SelectTrigger id="p-usage">
                    <SelectValue placeholder="Select usage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Suppliers link */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Suppliers
                  </p>
                  <p className="text-xs text-slate-400">
                    Link this product to suppliers (creates SupplierProduct
                    records)
                  </p>
                </div>

                <div className="w-[260px]">
                  <Select
                    value={selectedSupplierId}
                    onValueChange={setSelectedSupplierId}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier for variants" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierProducts
                        .filter((sp) => sp.isActive)
                        .map((sp) => (
                          <SelectItem key={sp.supplierId} value={sp.supplierId}>
                            {sp.supplier?.name ?? sp.supplierId}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suppliers.map((s) => {
                  const linked = supplierProducts.find(
                    (sp) => sp.supplierId === s.id,
                  );
                  const checked = linked ? linked.isActive : false;

                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 rounded border border-slate-800 bg-slate-900/40 px-3 py-2"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          handleToggleSupplier(s.id, Boolean(v))
                        }
                        disabled={loading}
                      />
                      <span className="text-sm text-slate-200">{s.name}</span>
                      {checked ? (
                        <span className="ml-auto text-[11px] text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="ml-auto text-[11px] text-slate-500">
                          Off
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Variants editor */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">Variants</p>
                <p className="text-xs text-slate-400">
                  Sizes/prices are supplier-specific (e.g., 20L, 5L, 25KG)
                </p>
              </div>

              {!selectedSupplierId || !selectedSP ? (
                <p className="text-sm text-slate-400">
                  Select an active supplier above to manage variants.
                </p>
              ) : (
                <VariantsPanel
                  productId={productId!}
                  supplierId={selectedSupplierId}
                  variants={selectedSP.variants}
                  disabled={loading}
                  onSave={handleUpsertVariant}
                  onDelete={handleDeleteVariant}
                  unitOptions={unitOptions}
                />
              )}
            </div>

            {/* footer */}
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
                Save Product
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VariantsPanel({
  productId,
  supplierId,
  variants,
  disabled,
  onSave,
  onDelete,
  unitOptions = ["L", "KG", "EA"],
}: VariantsPanelProps) {
  const [newSize, setNewSize] = useState<string>("");
  const [newUnit, setNewUnit] = useState<UnitCode>(unitOptions[0] ?? "L");
  const [newPrice, setNewPrice] = useState<string>("");

  useEffect(() => {
    // keep select valid if options change
    if (!unitOptions.includes(newUnit)) {
      setNewUnit(unitOptions[0] ?? "L");
    }
  }, [unitOptions, newUnit]);

  const sorted = useMemo(() => {
    return [...(variants ?? [])].sort((a, b) => {
      if (a.unit !== b.unit) return String(a.unit).localeCompare(String(b.unit));
      return a.size - b.size;
    });
  }, [variants]);

  return (
    <div className="space-y-3">
      {/* add row */}
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-4">
          <Label className="text-xs">Size</Label>
          <Input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="e.g., 20"
            disabled={disabled}
          />
        </div>

        <div className="col-span-3">
          <Label className="text-xs">Unit</Label>
          <Select
            value={newUnit}
            onValueChange={(v) => setNewUnit(String(v))}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-5">
          <Label className="text-xs">Price</Label>
          <div className="flex gap-2">
            <Input
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="e.g., 792.38"
              disabled={disabled}
            />
            <Button
              type="button"
              className="gap-2"
              disabled={disabled}
              onClick={async () => {
                const size = normalizeNumber(newSize);
                const price = normalizeNumber(newPrice);
                if (!size || !price) {
                  toast.error("Enter size and price");
                  return;
                }
                await onSave({
                  supplierId,
                  productId,
                  size,
                  unit: newUnit,
                  price,
                  isActive: true,
                });
                setNewSize("");
                setNewPrice("");
              }}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* list */}
      <div className="divide-y divide-slate-800 rounded border border-slate-800 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">
            No variants yet for this supplier.
          </div>
        ) : (
          sorted.map((v) => (
            <VariantRow
              key={v.id}
              v={v}
              disabled={disabled}
              onSave={onSave}
              onDelete={onDelete}
              supplierId={supplierId}
              productId={productId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function VariantRow({
  v,
  disabled,
  onSave,
  onDelete,
  supplierId,
  productId,
}: {
  v: Variant;
  disabled: boolean;
  supplierId: string;
  productId: string;
  onSave: VariantsPanelProps["onSave"];
  onDelete: VariantsPanelProps["onDelete"];
}) {
  const [price, setPrice] = useState<string>(String(v.price ?? 0));
  const [active, setActive] = useState<boolean>(Boolean(v.isActive));

  useEffect(() => {
    setPrice(String(v.price ?? 0));
    setActive(Boolean(v.isActive));
    // ✅ include values too so UI updates even if same id reused
  }, [v.id, v.price, v.isActive]);

  return (
    <div className="p-3 flex items-center gap-3">
      <div className="w-28 text-sm text-slate-200 font-medium">
        {v.size}
        {v.unit}
      </div>

      <div className="flex-1">
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={disabled}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-300">
        <Checkbox
          checked={active}
          onCheckedChange={(x) => setActive(Boolean(x))}
          disabled={disabled}
        />
        Active
      </label>

      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          onSave({
            id: v.id,
            supplierId,
            productId,
            size: v.size,
            unit: v.unit,
            price: normalizeNumber(price),
            sku: v.sku ?? null,
            isActive: active,
          })
        }
      >
        Save
      </Button>

      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => onDelete(v.id)}
        className="text-red-400 hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
