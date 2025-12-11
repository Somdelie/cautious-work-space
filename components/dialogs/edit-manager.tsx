/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateManager, getManagerById } from "@/actions/manager";

interface EditManagerDialogProps {
  managerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditManagerDialog({
  managerId,
  open,
  onOpenChange,
  onSuccess,
}: EditManagerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingManager, setLoadingManager] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Load manager data when managerId changes
  useEffect(() => {
    const fetchManager = async () => {
      if (!managerId || !open) {
        return;
      }

      setLoadingManager(true);
      try {
        const result = await getManagerById(managerId);
        if (result.success && result.data) {
          const manager = result.data;
          setName(manager.name);
          setPhone(manager.phone || "");
          setEmail(manager.email || "");
        } else {
          toast.error("Failed to load manager data");
          onOpenChange(false);
        }
      } catch (error) {
        toast.error("Failed to load manager data");
        onOpenChange(false);
      } finally {
        setLoadingManager(false);
      }
    };

    fetchManager();
  }, [managerId, open, onOpenChange]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setPhone("");
      setEmail("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!managerId) return;

    if (!name.trim()) {
      toast.error("Please enter a manager name");
      return;
    }

    setLoading(true);
    try {
      const result = await updateManager(managerId, {
        name,
        phone: phone || undefined,
        email: email || undefined,
      });

      if (result.success) {
        toast.success("Manager updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update manager");
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
          <DialogTitle>Edit Manager</DialogTitle>
          <DialogDescription>Update manager information</DialogDescription>
        </DialogHeader>

        {loadingManager ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-manager-name">Manager Name *</Label>
              <Input
                id="edit-manager-name"
                placeholder="e.g., John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager-email">Email</Label>
              <Input
                id="edit-manager-email"
                type="email"
                placeholder="e.g., john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager-phone">Phone</Label>
              <Input
                id="edit-manager-phone"
                placeholder="e.g., 123-456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Manager
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
