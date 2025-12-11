"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Pencil,
  Trash,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditManagerDialog } from "../dialogs/edit-manager"; // Assuming this dialog exists or will be created
import { CreateManagerDialog } from "../dialogs/create-manager";
import { DeleteManagerDialog } from "../dialogs/delete-manager";

type Manager = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type SortKey = keyof Manager;

export function ManagersTable({ managers }: { managers: Manager[] }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(
    null
  );
  const [managerToDelete, setManagerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredAndSortedManagers = useMemo(() => {
    const filtered = managers.filter(
      (manager) =>
        manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

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
  }, [managers, searchTerm, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedManagers.length / itemsPerPage);
  const paginatedManagers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedManagers.slice(startIndex, endIndex);
  }, [filteredAndSortedManagers, currentPage, itemsPerPage]);

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
          placeholder="Search managers..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="max-w-sm"
        />
        <CreateManagerDialog />
      </div>
      <Table className="w-full table-fixed">
        <TableCaption>A list of your managers.</TableCaption>
        <TableHeader className="">
          <TableRow className="w-full">
            <TableHead
              className="w-[30%] font-semibold cursor-pointer"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="w-[25%] font-semibold cursor-pointer"
              onClick={() => handleSort("email")}
            >
              <div className="flex items-center">
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="w-[20%] font-semibold cursor-pointer"
              onClick={() => handleSort("phone")}
            >
              <div className="flex items-center">
                Phone
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="w-[25%] text-right font-semibold" colSpan={2}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="w-full">
          {paginatedManagers.length > 0 ? (
            paginatedManagers.map((manager) => (
              <TableRow
                key={manager.id}
                className="w-full text-orange-700 bg-card/70"
              >
                <TableCell className="w-[30%] font-medium">
                  {manager.name}
                </TableCell>
                <TableCell className="w-[25%]">
                  {manager.email || "-"}
                </TableCell>
                <TableCell className="w-[20%]">
                  {manager.phone || "-"}
                </TableCell>
                <TableCell className="w-[25%] text-right" colSpan={2}>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedManagerId(manager.id);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setManagerToDelete({
                          id: manager.id,
                          name: manager.name,
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
                No managers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total Displayed</TableCell>
            <TableCell className="text-center">
              {paginatedManagers.length}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredAndSortedManagers.length} total managers.
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

      <EditManagerDialog
        managerId={selectedManagerId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <DeleteManagerDialog
        managerId={managerToDelete?.id ?? null}
        managerName={managerToDelete?.name}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setManagerToDelete(null);
          }
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
