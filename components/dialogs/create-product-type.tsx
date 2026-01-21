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
import { getSuppliers } from "@/actions/supplier";
import { toast } from "sonner";
import { createProductType } from "@/actions/product-type";

interface CreateProductTypeDialogProps {
  supplierId?: string;
  onSuccess?: () => void;
}

// Add price to state
// ...existing code...

interface Supplier {
  id: string;
  name: string;
}

export function CreateProductTypeDialog({
  supplierId,
  onSuccess,
}: CreateProductTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [type, setType] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    supplierId || "",
  );
  const [usage, setUsage] = useState("");
  const [price5L, setPrice5L] = useState(0);
  const [price20L, setPrice20L] = useState(0);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const result = await getSuppliers();
      if (result.success && result.data) {
        setSuppliers(result.data);
      }
    };
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type.trim()) {
      toast.error("Please enter a product type");
      return;
    }
    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (!usage) {
      toast.error("Please select product usage");
      return;
    }
    // Map UI value to backend value
    let usageType: "INTERNAL" | "EXTERNAL" | "BOTH";
    if (usage === "internal") usageType = "INTERNAL";
    else if (usage === "external") usageType = "EXTERNAL";
    else usageType = "BOTH";

    setLoading(true);
    try {
      const result = await createProductType({
        type,
        shortcut: shortcut || undefined,
        supplierId: selectedSupplierId,
        usageType,
        price5L,
        price20L,
      });

      if (result.success) {
        toast("Product type created successfully");
        setType("");
        setShortcut("");
        setSelectedSupplierId(supplierId || "");
        setUsage("");
        setPrice5L(0);
        setPrice20L(0);
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create product type");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Product Type</DialogTitle>
          <DialogDescription>
            Add a new product type to a supplier
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-type">Product Type *</Label>
            <Input
              id="product-type"
              placeholder="e.g., Velvaglo - Water-based"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortcut">Shortcut</Label>
            <Input
              id="shortcut"
              placeholder="e.g., VLW/TVW,TLS,TSA"
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-select">Supplier *</Label>
            <Select
              value={selectedSupplierId}
              onValueChange={setSelectedSupplierId}
            >
              <SelectTrigger id="supplier-select" disabled={loading}>
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
            <Label htmlFor="usage-select">Product Usage *</Label>
            <Select value={usage} onValueChange={setUsage} disabled={loading}>
              <SelectTrigger id="usage-select">
                <SelectValue placeholder="Select usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price20L">Price per 20 Litres</Label>
            <Input
              id="price20L"
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
            <Label htmlFor="price5L">Price per 5 Litres</Label>
            <Input
              id="price5L"
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Product Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
