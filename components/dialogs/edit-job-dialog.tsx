/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// actions you should have
import { getJobById, updateJob, setJobProducts } from "@/actions/job";
import { getManagers } from "@/actions/manager";
import { getSuppliers } from "@/actions/supplier";
import { getProducts } from "@/actions/product";

type Manager = { id: string; name: string };
type Supplier = { id: string; name: string };

type ProductLite = {
  id: string;
  name: string;
  shortcut: string | null;
};

type JobProductRow = {
  id: string;
  productId: string;
  required: boolean;
  quantity: number | null;
  unit: string | null;
  product?: ProductLite | null;
};

type JobDetail = {
  id: string;
  jobNumber: string;
  siteName: string;
  client: string | null;

  managerId: string | null;
  supplierId: string | null;

  specPdfUrl: string | null;
  boqPdfUrl: string | null;

  isStarted: boolean;
  isFinished: boolean;
  startedAt: string | null;
  finishedAt: string | null;

  source: "APP" | "EXCEL";
  importedAt: string | null;
  excelFileName: string | null;
  excelSheetName: string | null;
  excelRowRef: string | null;

  managerNameRaw: string | null;

  manager?: Manager | null;
  supplier?: Supplier | null;

  jobProducts: JobProductRow[];
};

export function EditJobDialog({
  jobId,
  open,
  onOpenChange,
  onSuccess,
}: {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);

  const [job, setJob] = useState<JobDetail | null>(null);

  const [managers, setManagers] = useState<Manager[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);

  // form fields
  const [siteName, setSiteName] = useState("");
  const [client, setClient] = useState("");
  const [managerId, setManagerId] = useState<string>("__none__");
  const [supplierId, setSupplierId] = useState<string>("__none__");
  const [specPdfUrl, setSpecPdfUrl] = useState("");
  const [boqPdfUrl, setBoqPdfUrl] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // products editor
  const [jobProducts, setJobProductsState] = useState<JobProductRow[]>([]);
  const [addProductId, setAddProductId] = useState<string>("");

  // load dropdown data when open
  useEffect(() => {
    if (!open) return;

    (async () => {
      const [mRes, sRes, pRes] = await Promise.all([
        getManagers(),
        getSuppliers(),
        getProducts(), // should return Product[] with at least id/name/shortcut
      ]);

      if (mRes?.success && mRes.data) setManagers(mRes.data);
      if (sRes?.success && sRes.data) setSuppliers(sRes.data);

      if (pRes?.success && pRes.data) {
        setProducts(
          (pRes.data as any[]).map((p) => ({
            id: p.id,
            name: p.name,
            shortcut: p.shortcut ?? null,
          })),
        );
      }
    })();
  }, [open]);

  // load job
  useEffect(() => {
    if (!open || !jobId) return;

    (async () => {
      setLoadingJob(true);
      try {
        const res = await getJobById(jobId);
        if (!res.success || !res.data) {
          toast.error(res.error || "Failed to load job");
          onOpenChange(false);
          return;
        }

        const j = res.data as JobDetail;
        setJob(j);

        setSiteName(j.siteName ?? "");
        setClient(j.client ?? "");
        setManagerId(j.managerId ?? "__none__");
        setSupplierId(j.supplierId ?? "__none__");
        setSpecPdfUrl(j.specPdfUrl ?? "");
        setBoqPdfUrl(j.boqPdfUrl ?? "");
        setIsStarted(Boolean(j.isStarted));
        setIsFinished(Boolean(j.isFinished));

        setJobProductsState(
          (j.jobProducts ?? []).map((jp) => ({
            id: jp.id,
            productId: jp.productId,
            required: Boolean(jp.required),
            quantity: jp.quantity ?? null,
            unit: jp.unit ?? null,
            product: jp.product ?? null,
          })),
        );

        setAddProductId("");
      } catch (e) {
        toast.error("Failed to load job");
        onOpenChange(false);
      } finally {
        setLoadingJob(false);
      }
    })();
  }, [open, jobId, onOpenChange]);

  // reset on close
  useEffect(() => {
    if (!open) {
      setLoading(false);
      setLoadingJob(false);
      setJob(null);
      setSiteName("");
      setClient("");
      setManagerId("__none__");
      setSupplierId("__none__");
      setSpecPdfUrl("");
      setBoqPdfUrl("");
      setIsStarted(false);
      setIsFinished(false);
      setJobProductsState([]);
      setAddProductId("");
    }
  }, [open]);

  const productOptions = useMemo(() => {
    const used = new Set(jobProducts.map((jp) => jp.productId));
    return products
      .filter((p) => !used.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, jobProducts]);

  function addJobProduct() {
    if (!addProductId) return;

    const p = products.find((x) => x.id === addProductId);
    setJobProductsState((prev) => [
      {
        id: `__new__${addProductId}`, // temp id, server will replace
        productId: addProductId,
        required: false,
        quantity: null,
        unit: null,
        product: p ?? null,
      },
      ...prev,
    ]);
    setAddProductId("");
  }

  function removeJobProduct(productId: string) {
    setJobProductsState((prev) => prev.filter((x) => x.productId !== productId));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId) return;

    if (!siteName.trim()) {
      toast.error("Site name is required");
      return;
    }

    setLoading(true);
    try {
      // 1) Update core job fields
      const core = await updateJob(jobId, {
        siteName: siteName.trim(),
        client: client.trim() || null,
        managerId: managerId === "__none__" ? null : managerId,
        supplierId: supplierId === "__none__" ? null : supplierId,
        specPdfUrl: specPdfUrl.trim() || null,
        boqPdfUrl: boqPdfUrl.trim() || null,
        isStarted,
        isFinished,
      });

      if (!core.success) {
        toast.error(core.error || "Failed to update job");
        return;
      }

      // 2) Persist jobProducts (recommended as ONE action)
      const jp = await setJobProducts(jobId, {
        items: jobProducts.map((x) => ({
          productId: x.productId,
          required: Boolean(x.required),
          quantity:
            x.quantity === null || x.quantity === undefined || Number.isNaN(x.quantity)
              ? null
              : Number(x.quantity),
          unit: (x.unit ?? "").trim() || null,
        })),
      });

      if (!jp.success) {
        toast.error(jp.error || "Job saved but products failed to update");
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>
            Update job details, manager/supplier, attachments, and products list.
          </DialogDescription>
        </DialogHeader>

        {loadingJob ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !job ? (
          <div className="text-sm text-muted-foreground">No job loaded.</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* meta */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Job Number</p>
                  <p className="font-mono font-semibold">{job.jobNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-semibold">{job.source}</p>
                  {job.source === "EXCEL" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {job.excelFileName ?? "Excel"} • {job.excelSheetName ?? "Sheet"} • {job.excelRowRef ?? "Row"}
                    </p>
                  )}
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={isStarted} onCheckedChange={(v) => setIsStarted(Boolean(v))} />
                    Started
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={isFinished} onCheckedChange={(v) => setIsFinished(Boolean(v))} />
                    Finished
                  </label>
                </div>
              </div>
            </div>

            {/* core */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Manager</Label>
                <Select value={managerId} onValueChange={setManagerId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {job.managerNameRaw ? (
                  <p className="text-xs text-muted-foreground">
                    Excel manager (raw): <span className="font-medium">{job.managerNameRaw}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* attachments */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              <p className="text-sm font-semibold">Attachments</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specPdfUrl">Spec PDF URL</Label>
                  <Input
                    id="specPdfUrl"
                    value={specPdfUrl}
                    onChange={(e) => setSpecPdfUrl(e.target.value)}
                    disabled={loading}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boqPdfUrl">BOQ PDF URL</Label>
                  <Input
                    id="boqPdfUrl"
                    value={boqPdfUrl}
                    onChange={(e) => setBoqPdfUrl(e.target.value)}
                    disabled={loading}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* jobProducts */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Job Products</p>
                  <p className="text-xs text-muted-foreground">
                    Choose products required for this job (stored in JobProduct).
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-[420px]">
                  <Select value={addProductId} onValueChange={setAddProductId} disabled={loading}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.shortcut ? `${p.shortcut} — ` : ""}{p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button type="button" onClick={addJobProduct} disabled={loading || !addProductId} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="divide-y rounded-md border overflow-hidden">
                {jobProducts.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No products linked.</div>
                ) : (
                  jobProducts.map((jp) => (
                    <div key={jp.productId} className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-5">
                        <p className="text-sm font-medium">
                          {jp.product?.shortcut ? `${jp.product.shortcut} — ` : ""}
                          {jp.product?.name ?? jp.productId}
                        </p>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Checkbox
                            checked={jp.required}
                            onCheckedChange={(v) =>
                              setJobProductsState((prev) =>
                                prev.map((x) =>
                                  x.productId === jp.productId ? { ...x, required: Boolean(v) } : x,
                                ),
                              )
                            }
                            disabled={loading}
                          />
                          Required
                        </label>
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={jp.quantity ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJobProductsState((prev) =>
                              prev.map((x) =>
                                x.productId === jp.productId
                                  ? { ...x, quantity: val === "" ? null : Number(val) }
                                  : x,
                              ),
                            );
                          }}
                          disabled={loading}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-xs">Unit</Label>
                        <Input
                          value={jp.unit ?? ""}
                          onChange={(e) =>
                            setJobProductsState((prev) =>
                              prev.map((x) =>
                                x.productId === jp.productId ? { ...x, unit: e.target.value } : x,
                              ),
                            )
                          }
                          disabled={loading}
                          placeholder="e.g. L / KG / EA"
                        />
                      </div>

                      <div className="sm:col-span-1 flex sm:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => removeJobProduct(jp.productId)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* footer */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Job
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
