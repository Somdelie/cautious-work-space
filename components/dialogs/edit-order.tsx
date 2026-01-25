import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EditOrderDialog({
  orderId,
  open,
  onOpenChange,
  onSuccess,
}: {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  // TODO: Implement edit order form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>
        <div className="py-8 text-center text-slate-400">
          Edit form for order <span className="font-mono">{orderId}</span> goes
          here.
        </div>
      </DialogContent>
    </Dialog>
  );
}
