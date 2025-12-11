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
    supplierId || ""
  );

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

    setLoading(true);
    try {
      const result = await createProductType({
        type,
        shortcut: shortcut || undefined,
        supplierId: selectedSupplierId,
      });

      if (result.success) {
        toast("Product type created successfully");
        setType("");
        setShortcut("");
        setSelectedSupplierId(supplierId || "");
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create product type");
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
