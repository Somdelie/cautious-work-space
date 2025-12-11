"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createManager } from "@/actions/manager";

interface CreateManagerDialogProps {
  onSuccess?: () => void;
}

export function CreateManagerDialog({ onSuccess }: CreateManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a manager name");
      return;
    }

    setLoading(true);
    try {
      const result = await createManager({
        name,
        phone: phone || undefined,
        email: email || undefined,
      });

      if (result.success) {
        toast("Manager created successfully");
        setName("");
        setPhone("");
        setEmail("");
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create manager");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Manager</DialogTitle>
          <DialogDescription>Add a new manager</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager-name">Manager Name *</Label>
            <Input
              id="manager-name"
              placeholder="e.g., John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager-email">Email</Label>
            <Input
              id="manager-email"
              type="email"
              placeholder="e.g., john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager-phone">Phone</Label>
            <Input
              id="manager-phone"
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Manager
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
