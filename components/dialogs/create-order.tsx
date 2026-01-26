"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createOrderForJob } from "@/actions/order";
import { searchPricedProductOptions } from "@/actions/variant";

/**
 * NOTE:
 * This dialog assumes:
 * - You already pick a JOB elsewhere, or you pass jobId down.
 * - Supplier selection is per item (as your old design).
 */

type OrderItemDraft = {
  productId: string;
  supplierId: string;

  // ✅ NEW: priced join row id (SupplierVariantPrice is keyed by supplierId + productOptionId)
  productOptionId: string;

  quantity: string; // string input
};

export function CreateOrderDialog({
  jobId,
}: {
  jobId: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [orderNumber, setOrderNumber] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([
    { productId: "", supplierId: "", productOptionId: "", quantity: "1" },
  ]);

  const canSubmit = useMemo(() => {
    if (!jobId) return false;
    if (!orderNumber.trim()) return false;
    if (!items.length) return false;
    return items.every(
      (it) =>
        it.productId &&
        it.supplierId &&
        it.productOptionId &&
        Number(it.quantity) > 0,
    );
  }, [jobId, orderNumber, items]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    try {
      const payload = {
        jobId,
        orderNumber: orderNumber.trim(),
        items: items.map((it) => ({
          productId: it.productId,
          supplierId: it.supplierId,
          productOptionId: it.productOptionId,
          quantity: Number(it.quantity),
        })),
      };

      const res = await createOrderForJob(payload);
      if (!res.success) {
        toast.error(res.error || "Failed to create order");
        return;
      }

      toast.success("Order created");
      setOpen(false);
      setOrderNumber("");
      setItems([{ productId: "", supplierId: "", productOptionId: "", quantity: "1" }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Order</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Order Number</Label>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder='e.g. "#65636"'
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="outline"
                className="h-8"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    { productId: "", supplierId: "", productOptionId: "", quantity: "1" },
                  ])
                }
              >
                + Add item
              </Button>
            </div>

            {items.map((it, idx) => (
              <OrderItemRow
                key={idx}
                value={it}
                onChange={(next) =>
                  setItems((prev) => prev.map((x, i) => (i === idx ? next : x)))
                }
                onRemove={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={!canSubmit || saving}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderItemRow({
  value,
  onChange,
  onRemove,
}: {
  value: OrderItemDraft;
  onChange: (next: OrderItemDraft) => void;
  onRemove: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    Array<{ productOptionId: string; label: string; unitPrice: number }>
  >([]);

  async function runSearch() {
    if (!value.supplierId || !value.productId) {
      toast.error("Pick supplier + product first");
      return;
    }
    const res = await searchPricedProductOptions({
      supplierId: value.supplierId,
      productId: value.productId,
      q,
    });
    if (!res.success || !res.data) {
      toast.error(res.error || "Search failed");
      return;
    }
    setResults(res.data);
  }

  return (
    <div className="rounded border border-slate-800 p-3 space-y-3">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <Label className="text-xs">ProductId</Label>
          <Input
            value={value.productId}
            onChange={(e) => onChange({ ...value, productId: e.target.value, productOptionId: "" })}
            placeholder="productId"
          />
        </div>

        <div className="col-span-4">
          <Label className="text-xs">SupplierId</Label>
          <Input
            value={value.supplierId}
            onChange={(e) => onChange({ ...value, supplierId: e.target.value, productOptionId: "" })}
            placeholder="supplierId"
          />
        </div>

        <div className="col-span-3">
          <Label className="text-xs">Qty</Label>
          <Input
            value={value.quantity}
            onChange={(e) => onChange({ ...value, quantity: e.target.value })}
            inputMode="decimal"
          />
        </div>

        <div className="col-span-1 flex items-end justify-end">
          <Button type="button" variant="ghost" className="h-10 px-2" onClick={onRemove}>
            ✕
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-8">
          <Label className="text-xs">Find priced option (e.g. 24mm)</Label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search..." />
        </div>
        <div className="col-span-4">
          <Button type="button" className="w-full" onClick={runSearch}>
            Search options
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Choose option</Label>
        <div className="grid grid-cols-1 gap-2">
          {results.map((r) => (
            <button
              key={r.productOptionId}
              type="button"
              onClick={() => onChange({ ...value, productOptionId: r.productOptionId })}
              className={`w-full text-left rounded border px-3 py-2 text-sm ${
                value.productOptionId === r.productOptionId
                  ? "border-green-600 bg-green-900/20"
                  : "border-slate-800 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{r.label}</span>
                <span className="text-slate-400">R{r.unitPrice.toFixed(2)}</span>
              </div>
            </button>
          ))}
          {!results.length && (
            <div className="text-xs text-slate-500">
              No results. Make sure supplier has prices set for this product’s options.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
