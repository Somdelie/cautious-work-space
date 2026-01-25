"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
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
import { Loader2, Upload, FileText, X, Info, Pencil } from "lucide-react";
import { toast } from "sonner";

import { getManagers } from "@/actions/manager";
import { getSuppliers } from "@/actions/supplier";
import { getJobById, updateJob } from "@/actions/job";
import { getProducts } from "@/actions/product";
import { bulkUpdateJobProducts } from "@/actions/job-product";

interface EditJobDialogProps {
  jobId: string | null; // pass selectedJobId
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode; // optional if you want to use DialogTrigger
}

interface Manager {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

type JobProductDraft = {
  id?: string;
  productId: string;
  productName: string;
  required: boolean;
  quantity: number | null;
  unit: string | null;
};

type JobDTO = {
  id: string;
  jobNumber: string;
  siteName: string;
  client: string | null;
  managerId: string | null;
  managerNameRaw: string | null;
  supplierId: string | null;
  specPdfUrl: string | null;
  boqPdfUrl: string | null;
  jobProducts?: Array<{
    id: string;
    productId: string;
    required: boolean;
    quantity: number | null;
    unit: string | null;
    product: { id: string; name: string };
  }>;
};

export function EditJobDialog({
  jobId,
  open,
  onOpenChange,
  onSuccess,
  trigger,
}: EditJobDialogProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const [managers, setManagers] = useState<Manager[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [jobNumber, setJobNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [client, setClient] = useState("");

  const [managerId, setManagerId] = useState<string>("");
  const [managerNameRaw, setManagerNameRaw] = useState<string>("");

  const [supplierId, setSupplierId] = useState<string>("");

  const [specPdfUrl, setSpecPdfUrl] = useState<string | null>(null);
  const [boqPdfUrl, setBoqPdfUrl] = useState<string | null>(null);

  const [specFileName, setSpecFileName] = useState<string | null>(null);
  const [boqFileName, setBoqFileName] = useState<string | null>(null);

  const [specUploading, setSpecUploading] = useState(false);
  const [boqUploading, setBoqUploading] = useState(false);

  // Job Products state
  const [jobProducts, setJobProducts] = useState<JobProductDraft[]>([]);
  const [allProducts, setAllProducts] = useState<
    { id: string; name: string }[]
  >([]);
  const [addProductId, setAddProductId] = useState<string>("");

  const selectedManager = useMemo(
    () => managers.find((m) => m.id === managerId) ?? null,
    [managers, managerId],
  );

  // keep raw name synced when selecting manager
  useEffect(() => {
    if (selectedManager) setManagerNameRaw(selectedManager.name);
  }, [selectedManager]);

  // fetch managers/suppliers/products on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchLists = async () => {
      try {
        const [mRes, sRes, pRes] = await Promise.all([
          getManagers(),
          getSuppliers(),
          getProducts(),
        ]);
        if (cancelled) return;
        if (mRes.success && mRes.data) setManagers(mRes.data);
        if (sRes.success && sRes.data) setSuppliers(sRes.data);
        if (pRes.success && pRes.data) {
          setAllProducts(
            pRes.data.map((p: any) => ({ id: p.id, name: p.name })),
          );
        }
      } catch {
        // not fatal
      }
    };
    fetchLists();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // fetch job details when dialog opens (and jobId changes)
  useEffect(() => {
    if (!open) return;
    // clear state if no jobId
    if (!jobId) {
      setJobNumber("");
      setSiteName("");
      setClient("");
      setManagerId("");
      setManagerNameRaw("");
      setSupplierId("");
      setSpecPdfUrl(null);
      setBoqPdfUrl(null);
      setSpecFileName(null);
      setBoqFileName(null);
      setJobProducts([]);
      return;
    }
    let cancelled = false;
    const fetchJob = async () => {
      setInitialLoading(true);
      try {
        const res = await getJobById(jobId);
        if (cancelled) return;
        if (!res?.success || !res?.data) {
          toast.error((res as any)?.error || "Failed to load job");
          return;
        }
        const j = res.data as JobDTO;
        setJobNumber(j.jobNumber ?? "");
        setSiteName(j.siteName ?? "");
        setClient(j.client ?? "");
        setManagerId(j.managerId ?? "");
        setManagerNameRaw(j.managerNameRaw ?? "");
        setSupplierId(j.supplierId ?? "");
        setSpecPdfUrl(j.specPdfUrl ?? null);
        setBoqPdfUrl(j.boqPdfUrl ?? null);
        setSpecFileName(null);
        setBoqFileName(null);
        setJobProducts(
          Array.isArray(j.jobProducts)
            ? j.jobProducts.map((jp) => ({
                id: jp.id,
                productId: jp.productId,
                productName: jp.product?.name || "",
                required: jp.required,
                quantity: jp.quantity ?? null,
                unit: jp.unit ?? "",
              }))
            : [],
        );
      } catch (e: any) {
        toast.error(e?.message || "Failed to load job");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };
    fetchJob();
    return () => {
      cancelled = true;
    };
  }, [open, jobId]);

  // reset uploads flags on close
  useEffect(() => {
    if (open) return;
    setLoading(false);
    setInitialLoading(false);
    setSpecUploading(false);
    setBoqUploading(false);
  }, [open]);

  const handlePdfUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccessCb: (url: string, name: string) => void,
    setUploading: (v: boolean) => void,
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
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to upload file");
      }

      const data = await response.json();
      onSuccessCb(data.url, file.name);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      toast.error("No job selected");
      return;
    }
    if (!jobNumber.trim()) {
      toast.error("Please enter a job number");
      return;
    }
    if (!siteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }
    if (!managerId && !managerNameRaw.trim()) {
      toast.error("Select a manager or type the manager name");
      return;
    }
    setLoading(true);
    try {
      // Save job meta
      const res = await updateJob(jobId, {
        jobNumber: jobNumber.trim(),
        siteName: siteName.trim(),
        client: client.trim() || undefined,
        managerId: managerId || undefined,
        supplierId: supplierId || undefined,
        specPdfUrl: specPdfUrl ?? undefined,
        boqPdfUrl: boqPdfUrl ?? undefined,
      });
      if (!res?.success) {
        toast.error((res as any)?.error || "Failed to update job");
        return;
      }
      // Save job products
      const productsToSave = jobProducts.map((jp) => ({
        productId: jp.productId,
        required: jp.required,
        quantity: jp.quantity ?? undefined,
        unit: jp.unit ?? undefined,
      }));
      const prodRes = await bulkUpdateJobProducts(jobId, productsToSave);
      if (!prodRes?.success) {
        toast.error(prodRes?.error || "Failed to update job products");
        return;
      }
      toast.success("Job updated");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>
            Update job details, link manager/supplier, and attach PDFs.
          </DialogDescription>
        </DialogHeader>

        {initialLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading job...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 max-h-[75vh] overflow-y-auto py-2 pr-3"
          >
            {/* Job meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-number">Job Number *</Label>
                <Input
                  id="job-number"
                  placeholder="e.g., 5962"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name *</Label>
                <Input
                  id="site-name"
                  placeholder="e.g., Kyalami Corner Interior"
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
                placeholder="e.g., Framecore Construction"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Manager + Supplier */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-4">
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Info className="h-4 w-4 mt-0.5" />
                <p>
                  Manager and Supplier are optional, but they make filtering and
                  costing easier.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Manager select */}
                <div className="space-y-2">
                  <Label htmlFor="manager-select">Manager (optional)</Label>
                  <Select
                    value={managerId}
                    onValueChange={setManagerId}
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="manager-select"
                      className="bg-slate-900 border-slate-800"
                    >
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Manager raw */}
                <div className="space-y-2">
                  <Label htmlFor="manager-raw">Manager Name (raw)</Label>
                  <Input
                    id="manager-raw"
                    placeholder="Type name (used for Excel imports too)"
                    value={managerNameRaw}
                    onChange={(e) => setManagerNameRaw(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Supplier select */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="supplier-select">Supplier (optional)</Label>
                  <Select
                    value={supplierId}
                    onValueChange={setSupplierId}
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="supplier-select"
                      className="bg-slate-900 border-slate-800"
                    >
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Job Products */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label>Job Products</Label>
                  <p className="text-xs text-slate-400">
                    Add, remove, and edit products for this job.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={addProductId}
                    onValueChange={setAddProductId}
                    disabled={loading}
                  >
                    <SelectTrigger className="min-w-[180px] bg-slate-900 border-slate-800">
                      <SelectValue placeholder="Add product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts
                        .filter(
                          (p) =>
                            !jobProducts.some((jp) => jp.productId === p.id),
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!addProductId) return;
                      const prod = allProducts.find(
                        (p) => p.id === addProductId,
                      );
                      if (!prod) return;
                      setJobProducts((prev) => [
                        ...prev,
                        {
                          productId: prod.id,
                          productName: prod.name,
                          required: true,
                          quantity: null,
                          unit: "",
                        },
                      ]);
                      setAddProductId("");
                    }}
                    disabled={loading || !addProductId}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {jobProducts.length === 0 ? (
                  <div className="text-xs text-slate-400">
                    No products assigned.
                  </div>
                ) : (
                  jobProducts.map((jp, idx) => (
                    <div
                      key={jp.productId}
                      className="flex items-center gap-2 border border-slate-800 rounded p-2 bg-slate-900/40"
                    >
                      <span className="flex-1 text-slate-100">
                        {jp.productName}
                      </span>
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        Qty
                        <Input
                          type="number"
                          min={0}
                          value={jp.quantity ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJobProducts((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? {
                                      ...p,
                                      quantity: val === "" ? null : Number(val),
                                    }
                                  : p,
                              ),
                            );
                          }}
                          className="w-16 bg-slate-900 border-slate-800"
                          disabled={loading}
                        />
                      </label>
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        Unit
                        <Input
                          value={jp.unit ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJobProducts((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, unit: val } : p,
                              ),
                            );
                          }}
                          className="w-14 bg-slate-900 border-slate-800"
                          disabled={loading}
                        />
                      </label>
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={jp.required}
                          onChange={(e) => {
                            setJobProducts((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, required: e.target.checked }
                                  : p,
                              ),
                            );
                          }}
                          disabled={loading}
                        />
                        Required
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setJobProducts((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        disabled={loading}
                        className="text-red-400 hover:text-red-300"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Attachments */}
            <div className="space-y-3">
              <Label>Attachments (PDF)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Spec */}
                <div className="border border-slate-800 rounded p-3 space-y-2 bg-slate-950/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-300" />
                      <span className="text-sm font-medium text-slate-100">
                        Project Spec
                      </span>
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
                    <p className="text-xs text-slate-400 break-all">
                      {specFileName || specPdfUrl}
                    </p>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded py-6 cursor-pointer hover:border-slate-700 transition-colors">
                      <Upload className="h-5 w-5 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-300">
                        Upload Spec PDF
                      </span>
                      <span className="text-[11px] text-slate-500">
                        PDF up to 20MB
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          handlePdfUpload(
                            e,
                            (url, fname) => {
                              setSpecPdfUrl(url);
                              setSpecFileName(fname);
                            },
                            setSpecUploading,
                          )
                        }
                        disabled={loading || specUploading}
                      />
                    </label>
                  )}

                  {specUploading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading spec...
                    </div>
                  )}
                </div>

                {/* BOQ */}
                <div className="border border-slate-800 rounded p-3 space-y-2 bg-slate-950/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-300" />
                      <span className="text-sm font-medium text-slate-100">
                        BOQ
                      </span>
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
                    <p className="text-xs text-slate-400 break-all">
                      {boqFileName || boqPdfUrl}
                    </p>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded py-6 cursor-pointer hover:border-slate-700 transition-colors">
                      <Upload className="h-5 w-5 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-300">
                        Upload BOQ PDF
                      </span>
                      <span className="text-[11px] text-slate-500">
                        PDF up to 20MB
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          handlePdfUpload(
                            e,
                            (url, fname) => {
                              setBoqPdfUrl(url);
                              setBoqFileName(fname);
                            },
                            setBoqUploading,
                          )
                        }
                        disabled={loading || boqUploading}
                      />
                    </label>
                  )}

                  {boqUploading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading BOQ...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !jobId}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Optional helper trigger you can use:
 *
 * <EditJobDialog
 *   jobId={selectedJobId}
 *   open={editOpen}
 *   onOpenChange={setEditOpen}
 *   onSuccess={() => router.refresh()}
 *   trigger={
 *     <Button variant="ghost" size="sm" className="gap-2">
 *       <Pencil className="h-4 w-4" />
 *       Edit
 *     </Button>
 *   }
 * />
 */
