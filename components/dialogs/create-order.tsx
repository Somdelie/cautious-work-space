import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrder } from "@/actions/order";
import { toast } from "sonner";

interface OrderItem {
  productTypeId: string;
  quantity: number;
  unit: string;
}

interface CreateOrderProps {
  jobId: string;
  jobNumber?: string;
  productTypes: Array<{
    id: string;
    type: string;
  }>;
  onOrderCreated?: () => void;
}

export function CreateOrder({
  jobId,
  jobNumber,
  productTypes,
  onOrderCreated,
}: CreateOrderProps) {
  const [open, setOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState(jobNumber || "");
  const [items, setItems] = useState<OrderItem[]>([
    { productTypeId: "", quantity: 0, unit: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { productTypeId: "", quantity: 0, unit: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      toast.error("Order number is required");
      return;
    }

    const validItems = items.filter(
      (item) => item.productTypeId && item.quantity > 0 && item.unit.trim()
    );

    if (validItems.length === 0) {
      toast.error("Add at least one item with quantity and unit");
      return;
    }

    setLoading(true);
    try {
      const result = await createOrder(orderNumber, jobId, validItems);
      if (result.success) {
        toast.success("Order created successfully");
        setOrderNumber("");
        setItems([{ productTypeId: "", quantity: 0, unit: "" }]);
        setOpen(false);
        onOrderCreated?.();
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      toast.error("Error creating order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + Add Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-number">Job Number</Label>
            <Input
              id="job-number"
              value={jobNumber || ""}
              disabled
              className="bg-slate-900/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-number">Order Number</Label>
            <Input
              id="order-number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g., 6633"
            />
          </div>

          <div className="space-y-3">
            <Label>Order Items</Label>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    value={item.productTypeId}
                    onValueChange={(value) =>
                      handleItemChange(index, "productTypeId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Qty"
                  />
                </div>

                <div className="w-20">
                  <Input
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(index, "unit", e.target.value)
                    }
                    placeholder="20L"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
            >
              + Add Item
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
