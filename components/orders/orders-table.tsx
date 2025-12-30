import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deleteOrder } from "@/actions/order";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";

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

type SortField = "orderNumber" | "totalItems" | "createdAt";
type SortDirection = "asc" | "desc";

export function OrdersTable({ orders, onOrderDeleted }: OrdersTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      // Search in order number
      if (order.orderNumber.toLowerCase().includes(query)) return true;

      // Search in product types
      return order.items.some((item) =>
        item.productType.type.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "orderNumber":
          comparison = a.orderNumber.localeCompare(b.orderNumber);
          break;
        case "totalItems":
          comparison = a.items.length - b.items.length;
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredOrders, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 inline" />
    );
  };

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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order number or product type..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("orderNumber")}
              >
                Order #
                <SortIcon field="orderNumber" />
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("totalItems")}
              >
                Total Items
                <SortIcon field="totalItems" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("createdAt")}
              >
                Created
                <SortIcon field="createdAt" />
              </TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, sortedOrders.length)} of {sortedOrders.length}{" "}
            orders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
