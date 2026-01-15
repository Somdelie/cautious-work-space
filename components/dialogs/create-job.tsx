"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { createJob } from "@/actions/job";
import { getManagers } from "@/actions/manager";
import { getSuppliers } from "@/actions/supplier";
import { getProductTypes } from "@/actions/product-type";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateJobDialogProps {
  onSuccess?: () => void;
}

interface Manager {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductType {
  id: string;
  type: string;
  shortcut: string | null;
  usageType: "INTERNAL" | "EXTERNAL" | "BOTH";
}

export function CreateJobDialog({ onSuccess }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<
    string[]
  >([]);
  const [jobNumber, setJobNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [client, setClient] = useState("");
  const [managerId, setManagerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [specPdfUrl, setSpecPdfUrl] = useState<string | null>(null);
  const [boqPdfUrl, setBoqPdfUrl] = useState<string | null>(null);
  const [specFileName, setSpecFileName] = useState<string | null>(null);
  const [boqFileName, setBoqFileName] = useState<string | null>(null);
  const [specUploading, setSpecUploading] = useState(false);
  const [boqUploading, setBoqUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [managersResult, suppliersResult] = await Promise.all([
        getManagers(),
        getSuppliers(),
      ]);

      if (managersResult.success && managersResult.data) {
        setManagers(managersResult.data);
      }
      if (suppliersResult.success && suppliersResult.data) {
        setSuppliers(suppliersResult.data);
      }
    };

    if (open) {
      fetchData();
    } else {
      // Reset form when dialog closes
      setJobNumber("");
      setSiteName("");
      setManagerId("");
      setSupplierId("");
      setSelectedProductTypeIds([]);
      setProductTypes([]);
      setSpecPdfUrl(null);
      setBoqPdfUrl(null);
      setSpecFileName(null);
      setBoqFileName(null);
      setSpecUploading(false);
      setBoqUploading(false);
      setClient("");
    }
  }, [open]);

  useEffect(() => {
    const fetchProductTypes = async () => {
      if (supplierId) {
        const result = await getProductTypes(supplierId);
        if (result.success && result.data) {
          setProductTypes(result.data);
        }
      } else {
        setProductTypes([]);
      }
      // Reset selected product types when supplier changes
      setSelectedProductTypeIds([]);
    };

    fetchProductTypes();
  }, [supplierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobNumber.trim()) {
      toast.error("Please enter a job number");
      return;
    }

    if (!siteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    if (!managerId) {
      toast.error("Please select a manager");
      return;
    }

    if (!supplierId) {
      toast("Please select a supplier");
      return;
    }

    setLoading(true);
    try {
      const result = await createJob({
        jobNumber,
        siteName,
        client,
        managerId,
        supplierId,
        productTypeIds:
          selectedProductTypeIds.length > 0
            ? selectedProductTypeIds
            : undefined,
        specPdfUrl: specPdfUrl ?? undefined,
        boqPdfUrl: boqPdfUrl ?? undefined,
      });

      if (result.success) {
        toast.success("Job created successfully");
        setJobNumber("");
        setSiteName("");
        setManagerId("");
        setSupplierId("");
        setSelectedProductTypeIds([]);
        setClient("");
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create job");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string, name: string) => void,
    setUploading: (value: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("PDF size must be less than 20MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const data = await response.json();
      onSuccess(data.url, file.name);
      toast.success("File uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[575px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Create a new job and assign it to a manager and supplier
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto py-2 pr-3"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-number">Job Number *</Label>
              <Input
                id="job-number"
                placeholder="e.g., JOB-001"
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name *</Label>
              <Input
                id="site-name"
                placeholder="e.g., Downtown Project"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client / Company Name</Label>
            <Input
              id="client"
              placeholder="e.g., Acme Corp."
              value={client}
              onChange={(e) => setClient(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager-select">Manager *</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger id="manager-select" disabled={loading}>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-select">Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="supplier-select" disabled={loading}>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {supplierId && (
            <div className="space-y-3">
              <Label>Product Types</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-3">
                {productTypes.length > 0 ? (
                  productTypes
                    .filter((productType) => {
                      // Example: filter by usageType
                      // You can add a UI control to select context (internal/external) and filter accordingly
                      // For now, show all
                      return true;
                    })
                    .map((productType) => (
                      <div
                        key={productType.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`product-type-${productType.id}`}
                          checked={selectedProductTypeIds.includes(
                            productType.id
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProductTypeIds([
                                ...selectedProductTypeIds,
                                productType.id,
                              ]);
                            } else {
                              setSelectedProductTypeIds(
                                selectedProductTypeIds.filter(
                                  (id) => id !== productType.id
                                )
                              );
                            }
                          }}
                          disabled={loading}
                        />
                        <Label
                          htmlFor={`product-type-${productType.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {productType.type}{" "}
                          <span className="text-xs text-rose-500">
                            ({productType.shortcut || "No shortcut"})
                          </span>
                          <span className="text-xs ml-2 text-blue-500">
                            {productType.usageType === "BOTH"
                              ? "Internal & External"
                              : productType.usageType === "INTERNAL"
                              ? "Internal Only"
                              : "External Only"}
                          </span>
                        </Label>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No product types available for this supplier
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label>Attachments (PDF)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Project Spec</span>
                  </div>
                  {specPdfUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setSpecPdfUrl(null);
                        setSpecFileName(null);
                      }}
                      disabled={loading || specUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {specPdfUrl ? (
                  <p className="text-xs text-muted-foreground break-all">
                    {specFileName || "spec.pdf"}
                  </p>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md py-6 cursor-pointer hover:border-primary/60 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Upload Spec PDF
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      PDF up to 20MB
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        handlePdfUpload(
                          e,
                          (url, name) => {
                            setSpecPdfUrl(url);
                            setSpecFileName(name);
                          },
                          setSpecUploading
                        )
                      }
                      disabled={loading || specUploading}
                    />
                  </label>
                )}
                {specUploading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading spec...
                  </div>
                )}
              </div>

              <div className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">BOQ</span>
                  </div>
                  {boqPdfUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setBoqPdfUrl(null);
                        setBoqFileName(null);
                      }}
                      disabled={loading || boqUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {boqPdfUrl ? (
                  <p className="text-xs text-muted-foreground break-all">
                    {boqFileName || "boq.pdf"}
                  </p>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md py-6 cursor-pointer hover:border-primary/60 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Upload BOQ PDF
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      PDF up to 20MB
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        handlePdfUpload(
                          e,
                          (url, name) => {
                            setBoqPdfUrl(url);
                            setBoqFileName(name);
                          },
                          setBoqUploading
                        )
                      }
                      disabled={loading || boqUploading}
                    />
                  </label>
                )}
                {boqUploading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading BOQ...
                  </div>
                )}
              </div>
            </div>
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
              Create Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
