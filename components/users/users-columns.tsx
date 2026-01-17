"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

/* ================= TYPES ================= */

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  blocked: boolean;
};

export type EditUserHandler = (user: User) => void;

/* ================= COLUMNS ================= */

export function getUserColumns(onEditUser: EditUserHandler): ColumnDef<User>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (row.getValue("phone") as string) || "—",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="capitalize">{row.getValue("role")}</span>
      ),
    },
    {
      accessorKey: "blocked",
      header: "Status",
      cell: ({ row }) => {
        const blocked = row.getValue("blocked") as boolean;
        return blocked ? (
          <Badge variant="destructive">Blocked</Badge>
        ) : (
          <Badge variant="secondary">Active</Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Open actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(user.id)}
                >
                  Copy user ID
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onEditUser(user)}>
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => console.log("toggle", user)}>
                  {user.blocked ? "Unblock" : "Block"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => console.log("delete", user)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
