"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { deleteSupplier } from "@/actions/supplier";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteSupplierDialogProps {
  supplierId: string | null;
  supplierName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteSupplierDialog({
  supplierId,
  supplierName,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSupplierDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!supplierId) return;

    setLoading(true);
    try {
      const result = await deleteSupplier(supplierId);
      if (result.success) {
        toast.success("Supplier deleted successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to delete supplier");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Supplier</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this supplier? This will permanently
            delete{" "}
            {supplierName && (
              <span className="font-semibold text-foreground">
                {supplierName}
              </span>
            )}
            .
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Supplier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

