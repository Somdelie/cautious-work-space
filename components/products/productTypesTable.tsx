"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductType, Supplier } from "@prisma/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Pencil,
  Trash,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EditProductTypeDialog } from "@/components/dialogs/edit-product-type";
import { DeleteProductTypeDialog } from "@/components/dialogs/delete-product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateProductTypeDialog } from "../dialogs/create-product";

type ProductTypeWithSupplier = ProductType & {
  supplier: Supplier;
};

type SortKey = keyof ProductTypeWithSupplier | "supplierName";

export function ProductTypesTable({
  productTypes,
}: {
  productTypes: ProductTypeWithSupplier[];
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<
    string | null
  >(null);
  const [productTypeToDelete, setProductTypeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortKey>("type");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredAndSortedProductTypes = useMemo(() => {
    const filtered = productTypes.filter(
      (productType) =>
        productType.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productType.shortcut
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        productType.supplier?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue =
        sortColumn === "supplierName" ? a.supplier?.name : a[sortColumn];
      const bValue =
        sortColumn === "supplierName" ? b.supplier?.name : b[sortColumn];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (aValue === null || aValue === undefined)
        return sortDirection === "asc" ? 1 : -1;
      if (bValue === null || bValue === undefined)
        return sortDirection === "asc" ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [productTypes, searchTerm, sortColumn, sortDirection]);

  const totalPages = Math.ceil(
    filteredAndSortedProductTypes.length / itemsPerPage
  );
  const paginatedProductTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProductTypes.slice(startIndex, endIndex);
  }, [filteredAndSortedProductTypes, currentPage, itemsPerPage]);

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search product types..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="max-w-sm"
        />
        <CreateProductTypeDialog />
      </div>
      <Table className="w-full table-fixed rounded overflow-hidden">
        {/* <TableCaption>A list of your recent product types.</TableCaption> */}
        <TableHeader className="w-full bg-slate-800/80">
          <TableRow className="w-full">
            <TableHead
              className="w-[25%] font-semibold cursor-pointer"
              onClick={() => handleSort("shortcut")}
            >
              <div className="flex items-center">
                Shortcut
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="w-[25%] font-semibold cursor-pointer"
              onClick={() => handleSort("type")}
            >
              <div className="flex items-center">
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="w-[25%] font-semibold cursor-pointer"
              onClick={() => handleSort("supplierName")}
            >
              <div className="flex items-center">
                Supplier
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="w-[25%] text-right font-semibold" colSpan={2}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="w-full">
          {paginatedProductTypes.length > 0 ? (
            paginatedProductTypes.map((productType) => (
              <TableRow
                key={productType.id}
                className="w-full text-orange-700 bg-card/70"
              >
                <TableCell className="w-[15%]">
                  {productType.shortcut || "-"}
                </TableCell>
                <TableCell className="w-[30%] font-medium">
                  {productType.type}
                </TableCell>
                <TableCell className="w-[30%]">
                  {productType.supplier?.name || "-"}
                </TableCell>
                <TableCell className="w-[25%] text-right" colSpan={2}>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedProductTypeId(productType.id);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setProductTypeToDelete({
                          id: productType.id,
                          name: productType.type,
                        });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No product types found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total Displayed</TableCell>
            <TableCell className="text-center">
              {paginatedProductTypes.length}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredAndSortedProductTypes.length} total product types.
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <EditProductTypeDialog
        productTypeId={selectedProductTypeId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <DeleteProductTypeDialog
        productTypeId={productTypeToDelete?.id ?? null}
        productTypeName={productTypeToDelete?.name}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setProductTypeToDelete(null);
          }
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
