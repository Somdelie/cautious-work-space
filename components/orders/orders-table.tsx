import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteOrder } from "@/actions/order";
import { useState } from "react";

interface OrderItem {
  id: string;
  quantity: number;
  unit: string;
  productType: {
    id: string;
    type: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  createdAt: string | Date;
}

interface OrdersTableProps {
  orders: Order[];
  onOrderDeleted?: () => void;
}

export function OrdersTable({ orders, onOrderDeleted }: OrdersTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    setDeleting(orderId);
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        toast.success("Order deleted");
        onOrderDeleted?.();
      } else {
        toast.error(result.error || "Failed to delete order");
      }
    } catch (error) {
      toast.error("Error deleting order");
    } finally {
      setDeleting(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders created yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total Items</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-semibold">
                {order.orderNumber}
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.quantity}x{item.unit} {item.productType.type}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>{order.items.length}</TableCell>
              <TableCell className="text-sm">
                {new Date(order.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(order.id)}
                  disabled={deleting === order.id}
                >
                  {deleting === order.id ? "..." : "Delete"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
