"use client";

import { useEffect, useState } from "react";
import { getUserColumns, User } from "./users-columns";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "../ui/data-table";
import { Button } from "../ui/button";

import { EditUserDialog } from "@/components/dialogs/edit-user";
import { CreateUserDialog } from "../dialogs/create-user";

export default function UsersTable() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCreateDialogOpen, setUserCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <Button onClick={() => setUserCreateDialogOpen(true)}>
            Add New User
          </Button>
        </div>
        <DataTable
          columns={getUserColumns((user) => {
            setEditingUser(user);
            setEditDialogOpen(true);
          })}
          data={data}
        />
        <CreateUserDialog
          open={userCreateDialogOpen}
          onOpenChange={setUserCreateDialogOpen}
          onUserCreated={(user) => {
            setData((prev) => [...prev, user]);
          }}
        />
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingUser(null);
          }}
          user={editingUser}
          onUserUpdated={(updated) => {
            setData((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u)),
            );
          }}
        />
      </div>
    </>
  );
}
