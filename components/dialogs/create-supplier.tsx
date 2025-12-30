"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupplier } from "@/actions/supplier";
import { toast } from "sonner";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface CreateSupplierDialogProps {
  onSuccess?: () => void;
}

export function CreateSupplierDialog({
  onSuccess,
}: CreateSupplierDialogProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMsg = error.error || "Failed to upload image";
        const fullError = `${errorMsg}${
          error.debug
            ? "\n\nDebug: " + JSON.stringify(error.debug, null, 2)
            : ""
        }`;
        setUploadError(fullError);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setLogoUrl(data.url);
      setLogoPreview(URL.createObjectURL(file));
      setUploadError(null);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to upload logo";
      console.error("Upload error:", error);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a supplier name");
      return;
    }

    setLoading(true);

    try {
      await createSupplier({
        name: name.trim(),
        logoUrl: logoUrl || undefined,
      });
      toast.success("Supplier created successfully");
      setName("");
      setLogoUrl(null);
      setLogoPreview(null);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setUploadError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" /> Add New Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Supplier Name *</Label>
            <Input
              id="name"
              placeholder="Enter supplier name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-red-800 mb-2">
                Upload Error Details:
              </p>
              <pre className="text-red-700 whitespace-pre-wrap break-words text-xs max-h-32 overflow-y-auto font-mono">
                {uploadError}
              </pre>
            </div>
          )}

          <div className="space-y-2">
            <Label>Supplier Logo</Label>
            {logoPreview ? (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={handleRemoveLogo}
                  disabled={loading || uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6">
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload logo
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </span>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading || uploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setName("");
                setLogoUrl(null);
                setLogoPreview(null);
              }}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
