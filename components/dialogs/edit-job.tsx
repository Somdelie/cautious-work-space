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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateJob, getJobById, markJobAsFinished } from "@/actions/job";
import { getManagers } from "@/actions/manager";
import { getSuppliers } from "@/actions/supplier";
import { getProductTypes } from "@/actions/product-type";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

interface EditJobDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function EditJobDialog({
  jobId,
  open,
  onOpenChange,
  onSuccess,
}: EditJobDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [markingFinished, setMarkingFinished] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<string[]>([]);
  const [jobNumber, setJobNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Load managers and suppliers when dialog opens
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
    }
  }, [open]);

  // Load job data when jobId changes
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId || !open) {
        return;
      }

      setLoadingJob(true);
      try {
        const result = await getJobById(jobId);
        if (result.success && result.data) {
          const job = result.data;
          setJobNumber(job.jobNumber);
          setSiteName(job.siteName);
          setManagerId(job.managerId);
          setSupplierId(job.supplierId);
          setIsStarted(job.isStarted || false);
          setIsFinished(job.isFinished || false);
          
          // Set selected product types
          if (job.productTypes) {
            setSelectedProductTypeIds(job.productTypes.map((pt: { id: string }) => pt.id));
          }
        } else {
          toast.error("Failed to load job data");
          onOpenChange(false);
        }
      } catch (error) {
        toast.error("Failed to load job data");
        onOpenChange(false);
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId, open, onOpenChange]);

  // Load product types when supplier changes
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
    };

    if (supplierId) {
      fetchProductTypes();
    }
  }, [supplierId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setJobNumber("");
      setSiteName("");
      setManagerId("");
      setSupplierId("");
      setSelectedProductTypeIds([]);
      setProductTypes([]);
      setIsStarted(false);
      setIsFinished(false);
    }
  }, [open]);

  const handleMarkAsFinished = async () => {
    if (!jobId) return;

    setMarkingFinished(true);
    try {
      const result = await markJobAsFinished(jobId);
      if (result.success) {
        toast.success("Job marked as finished");
        setIsFinished(true);
        setIsStarted(true);
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to mark job as finished");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setMarkingFinished(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobId) return;

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
      toast.error("Please select a supplier");
      return;
    }

    setLoading(true);
    try {
      const result = await updateJob(jobId, {
        jobNumber,
        siteName,
        managerId,
        supplierId,
        productTypeIds: selectedProductTypeIds,
      });

      if (result.success) {
        toast.success("Job updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update job");
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
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>
            Update job information and assignments
          </DialogDescription>
        </DialogHeader>

        {loadingJob ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-job-number">Job Number *</Label>
                <Input
                  id="edit-job-number"
                  placeholder="e.g., JOB-001"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-site-name">Site Name *</Label>
                <Input
                  id="edit-site-name"
                  placeholder="e.g., Downtown Project"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manager-select">Manager *</Label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger id="edit-manager-select" disabled={loading}>
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
                <Label htmlFor="edit-supplier-select">Supplier *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger id="edit-supplier-select" disabled={loading}>
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
                    productTypes.map((productType) => (
                      <div key={productType.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-product-type-${productType.id}`}
                          checked={selectedProductTypeIds.includes(productType.id)}
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
                          htmlFor={`edit-product-type-${productType.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {productType.type}
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
              {isStarted && !isFinished && (
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm text-blue-400 font-medium">
                      Job is ongoing
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMarkAsFinished}
                    disabled={markingFinished || loading}
                    className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {markingFinished ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Mark as Finished
                  </Button>
                </div>
              )}
              {isFinished && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">
                    Job is finished
                  </span>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading || markingFinished}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || markingFinished} className="gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Job
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


