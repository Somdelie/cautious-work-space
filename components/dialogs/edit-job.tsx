"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  Upload,
  FileText,
  X,
  Info,
  Check,
  ChevronsUpDown,
  Trash2,
  Search,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { getManagers } from "@/actions/manager";
import { getSuppliers } from "@/actions/supplier";
import { getProducts } from "@/actions/product";
import { bulkUpdateJobProducts } from "@/actions/job-product";
import {
  searchVariantsAction,
  VariantSearchRow,
} from "@/actions/variant-search";
import { formatCurrency } from "@/lib/formatCurrency";
import { Checkbox } from "@/components/ui/checkbox";
import { getJobByIdDTO, updateJob } from "@/actions/job";

interface EditJobDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
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

type ProductLite = {
  id: string;
  name: string;
  usageType?: "INTERNAL" | "EXTERNAL" | "BOTH";
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

  specNotRequired: boolean;
  boqNotRequired: boolean;
  safetyFileNotRequired: boolean;

  safetyFile: boolean; // ✅ boolean received

  specsReceived: boolean; // if you use it in table/UI

  jobProducts?: Array<{
    id: string;
    productId: string;
    required: boolean;
    quantity: number | null;
    unit: string | null;
    product: { id: string; name: string };
  }>;
};

function checkedToBool(v: boolean | "indeterminate") {
  return v === true;
}

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


  // Always provide defaults for all fields
  const [jobNumber, setJobNumber] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("");
  const [client, setClient] = useState<string>("");

  const [managerId, setManagerId] = useState<string>("");
  const [managerNameRaw, setManagerNameRaw] = useState<string>("");

  const [supplierId, setSupplierId] = useState<string>("");
  const [supplierOpen, setSupplierOpen] = useState(false);

  const [specPdfUrl, setSpecPdfUrl] = useState<string | null>(null);
  const [boqPdfUrl, setBoqPdfUrl] = useState<string | null>(null);

  const [specNotRequired, setSpecNotRequired] = useState<boolean>(false);
  const [boqNotRequired, setBoqNotRequired] = useState<boolean>(false);
  const [safetyFileNotRequired, setSafetyFileNotRequired] = useState<boolean>(false);

  // ✅ safety received boolean
  const [safetyFileReceived, setSafetyFileReceived] = useState<boolean>(false);

  const [specFileName, setSpecFileName] = useState<string | null>(null);
  const [boqFileName, setBoqFileName] = useState<string | null>(null);

  const [specUploading, setSpecUploading] = useState<boolean>(false);
  const [boqUploading, setBoqUploading] = useState<boolean>(false);

  const [jobProducts, setJobProducts] = useState<JobProductDraft[]>([]);
  const [allProducts, setAllProducts] = useState<ProductLite[]>([]);

  // Job number edit confirmation
  const [jobNumberEditMode, setJobNumberEditMode] = useState(false);
  const [showJobNumberConfirm, setShowJobNumberConfirm] = useState(false);
  const [pendingJobNumber, setPendingJobNumber] = useState<string>("");

  // Variant picker
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [variantQuery, setVariantQuery] = useState("");
  const [variantResults, setVariantResults] = useState<VariantSearchRow[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantCursor, setVariantCursor] = useState<string | null>(null);

  const selectedManager = useMemo(
    () => managers.find((m) => m.id === managerId) ?? null,
    [managers, managerId],
  );

  useEffect(() => {
    if (selectedManager) setManagerNameRaw(selectedManager.name);
  }, [selectedManager]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
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
            pRes.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              usageType: p.usageType,
            })),
          );
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (!jobId) {
      setJobNumber("");
      setSiteName("");
      setClient("");
      setManagerId("");
      setManagerNameRaw("");
      setSupplierId("");

      setSpecPdfUrl(null);
      setBoqPdfUrl(null);

      setSpecNotRequired(false);
      setBoqNotRequired(false);
      setSafetyFileNotRequired(false);

      setSafetyFileReceived(false);

      setSpecFileName(null);
      setBoqFileName(null);

      setJobProducts([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setInitialLoading(true);
      try {
        const res = await getJobByIdDTO(jobId);
        if (cancelled) return;

        if (!res?.success || !res?.data) {
          toast.error((res as any)?.error || "Failed to load job");
          return;
        }

        // Map JobRowDTO to JobDTO, filling missing fields with null/defaults
        const row = res.data as any;
        const j: JobDTO = {
          id: row.id,
          jobNumber: row.jobNumber,
          siteName: row.siteName,
          client: row.client ?? null,
          managerId: row.manager?.id ?? null,
          managerNameRaw: row.manager?.name ?? null,
          supplierId: row.supplier?.id ?? null,
          specPdfUrl: row.specPdfUrl ?? null,
          boqPdfUrl: row.boqPdfUrl ?? null,
          specNotRequired: row.specNotRequired ?? false,
          boqNotRequired: row.boqNotRequired ?? false,
          safetyFileNotRequired: row.safetyFileNotRequired ?? false,
          safetyFile: row.safetyFile ?? false,
          specsReceived: row.specsReceived ?? false,
          jobProducts: row.jobProducts ?? [],
        };

        setJobNumber(j.jobNumber ?? "");
        setPendingJobNumber(j.jobNumber ?? "");
        setSiteName(j.siteName ?? "");
        setClient(j.client ?? "");
        setManagerId(j.managerId ?? "");
        setManagerNameRaw(j.managerNameRaw ?? "");
        setSupplierId(j.supplierId ?? "");

        setSpecPdfUrl(j.specPdfUrl ?? null);
        setBoqPdfUrl(j.boqPdfUrl ?? null);

        setSpecNotRequired(Boolean(j.specNotRequired));
        setBoqNotRequired(Boolean(j.boqNotRequired));
        setSafetyFileNotRequired(Boolean(j.safetyFileNotRequired));

        setSafetyFileReceived(Boolean(j.safetyFile));

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
    })();

    return () => {
      cancelled = true;
    };
  }, [open, jobId]);

  // hide uploads if not required + clear urls
  useEffect(() => {
    if (!open) return;
    if (specNotRequired) {
      setSpecPdfUrl(null);
      setSpecFileName(null);
      setSpecUploading(false);
    }
  }, [specNotRequired, open]);

  useEffect(() => {
    if (!open) return;
    if (boqNotRequired) {
      setBoqPdfUrl(null);
      setBoqFileName(null);
      setBoqUploading(false);
    }
  }, [boqNotRequired, open]);

  // ✅ if safety file becomes "not required", force received=false
  useEffect(() => {
    if (!open) return;
    if (safetyFileNotRequired) {
      setSafetyFileReceived(false);
    }
  }, [safetyFileNotRequired, open]);

  // Search variants when query changes
  useEffect(() => {
    const q = variantQuery.trim();
    if (!variantPickerOpen || q.length < 2) {
      setVariantResults([]);
      setVariantCursor(null);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setVariantLoading(true);
      try {
        const res = await searchVariantsAction({ q, take: 20 });
        if (cancelled) return;
        if (res.success) {
          setVariantResults(res.data);
          setVariantCursor(res.nextCursor);
        }
      } catch {
        if (!cancelled) toast.error("Failed to search products");
      } finally {
        if (!cancelled) setVariantLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [variantQuery, variantPickerOpen]);

  const loadMoreVariants = useCallback(async () => {
    const q = variantQuery.trim();
    if (variantLoading || !variantCursor || q.length < 2) return;

    setVariantLoading(true);
    try {
      const res = await searchVariantsAction({
        q,
        take: 20,
        cursor: variantCursor,
      });
      if (res.success) {
        setVariantResults((prev) => [...prev, ...res.data]);
        setVariantCursor(res.nextCursor);
      }
    } catch {
      toast.error("Failed to load more products");
    } finally {
      setVariantLoading(false);
    }
  }, [variantCursor, variantLoading, variantQuery]);

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

    if (!jobId) return toast.error("No job selected");
    if (!jobNumber.trim()) return toast.error("Please enter a job number");
    if (!siteName.trim()) return toast.error("Please enter a site name");
    if (!managerId && !managerNameRaw.trim())
      return toast.error("Select a manager or type the manager name");

    setLoading(true);
    try {
      const res = await updateJob(jobId, {
        jobNumber: jobNumber.trim(),
        siteName: siteName.trim(),
        client: client.trim() || undefined,
        managerId: managerId || null,
        supplierId: supplierId || null,

        specPdfUrl: specNotRequired ? null : (specPdfUrl ?? null),
        boqPdfUrl: boqNotRequired ? null : (boqPdfUrl ?? null),

        specNotRequired,
        boqNotRequired,
        safetyFileNotRequired,

        // ✅ safety received only when required
        safetyFile: safetyFileNotRequired ? false : safetyFileReceived,
      });

      if (!res?.success) {
        toast.error((res as any)?.error || "Failed to update job");
        return;
      }

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

      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Edit Job</DialogTitle>
          <DialogDescription>
            Update job details, assign products, and manage attachments
          </DialogDescription>
        </DialogHeader>

        {initialLoading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading job details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label htmlFor="job-number">
                      Job Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="job-number"
                        placeholder="e.g., 5962"
                        value={jobNumberEditMode ? pendingJobNumber : jobNumber}
                        onChange={(e) => setPendingJobNumber(e.target.value)}
                        disabled={loading || !jobNumberEditMode}
                      />
                      {!jobNumberEditMode ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowJobNumberConfirm(true)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setJobNumber(pendingJobNumber);
                            setJobNumberEditMode(false);
                          }}
                          disabled={loading}
                        >
                          Save
                        </Button>
                      )}
                    </div>
                    {/* Confirmation Dialog */}
                    {showJobNumberConfirm && (
                      <Dialog open={showJobNumberConfirm} onOpenChange={setShowJobNumberConfirm}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Edit</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to edit the job number? This may affect job tracking and reporting.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowJobNumberConfirm(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                setJobNumberEditMode(true);
                                setShowJobNumberConfirm(false);
                              }}
                            >
                              Yes, Edit
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site-name">
                      Site Name <span className="text-destructive">*</span>
                    </Label>
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
              </div>

              {/* Manager & Supplier */}
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-muted/50 border">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Manager and Supplier are optional but recommended for better
                    filtering and cost tracking.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager-select">Manager</Label>
                    <Select
                      value={managerId}
                      onValueChange={setManagerId}
                      disabled={loading}
                    >
                      <SelectTrigger id="manager-select">
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

                  <div className="space-y-2">
                    <Label htmlFor="manager-raw">Manager Name (Raw)</Label>
                    <Input
                      id="manager-raw"
                      placeholder="For Excel imports"
                      value={managerNameRaw}
                      onChange={(e) => setManagerNameRaw(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Supplier</Label>
                    <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={supplierOpen}
                          className="w-full justify-between"
                          disabled={loading}
                        >
                          {supplierId
                            ? suppliers.find((s) => s.id === supplierId)?.name
                            : "Select supplier..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search supplier..." />
                          <CommandEmpty>No supplier found.</CommandEmpty>
                          <CommandGroup>
                            {suppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.id}
                                value={supplier.name}
                                onSelect={() => {
                                  setSupplierId(
                                    supplier.id === supplierId
                                      ? ""
                                      : supplier.id,
                                  );
                                  setSupplierOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    supplierId === supplier.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {supplier.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Attachments
                </h3>

                {/* ✅ Only checkbox controls + safety received toggle (conditional) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="spec-not-required"
                      checked={specNotRequired}
                      onCheckedChange={(v) =>
                        setSpecNotRequired(checkedToBool(v))
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="spec-not-required">Spec Not Required</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="boq-not-required"
                      checked={boqNotRequired}
                      onCheckedChange={(v) =>
                        setBoqNotRequired(checkedToBool(v))
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="boq-not-required">BOQ Not Required</Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="safetyfile-not-required"
                        checked={safetyFileNotRequired}
                        onCheckedChange={(v) =>
                          setSafetyFileNotRequired(checkedToBool(v))
                        }
                        disabled={loading}
                      />
                      <Label htmlFor="safetyfile-not-required">
                        Safety File Not Required
                      </Label>
                    </div>

                    {!safetyFileNotRequired && (
                      <div className="flex items-center gap-3 pl-7">
                        <Checkbox
                          id="safetyfile-received"
                          checked={safetyFileReceived}
                          onCheckedChange={(v) =>
                            setSafetyFileReceived(checkedToBool(v))
                          }
                          disabled={loading}
                        />
                        <Label htmlFor="safetyfile-received">
                          Safety File Received
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spec + BOQ uploads only if required */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Spec PDF */}
                  <div className="border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Project Spec
                        </span>
                      </div>
                      {!specNotRequired && specPdfUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
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

                    {specNotRequired ? (
                      <p className="text-xs text-muted-foreground">
                        Hidden (Not Required)
                      </p>
                    ) : specPdfUrl ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {specFileName || specPdfUrl}
                      </p>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed py-8 cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">
                          Upload Spec PDF
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Max 20MB
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>

                  {/* BOQ PDF */}
                  <div className="border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">BOQ</span>
                      </div>
                      {!boqNotRequired && boqPdfUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
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

                    {boqNotRequired ? (
                      <p className="text-xs text-muted-foreground">
                        Hidden (Not Required)
                      </p>
                    ) : boqPdfUrl ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {boqFileName || boqPdfUrl}
                      </p>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed py-8 cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">
                          Upload BOQ PDF
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Max 20MB
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Products (same logic as before) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Products
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Manage products required for this job
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <CommandDialog
                      open={variantPickerOpen}
                      onOpenChange={(v) => {
                        setVariantPickerOpen(v);
                        if (!v) {
                          setVariantQuery("");
                          setVariantResults([]);
                          setVariantCursor(null);
                        }
                      }}
                    >
                      <Command className="rounded-lg border-slate-800">
                        <CommandInput
                          placeholder="Search by product, supplier, or SKU..."
                          value={variantQuery}
                          onValueChange={setVariantQuery}
                          className="border-0 focus:ring-0"
                        />
                        <CommandList>
                          {variantLoading && (
                            <div className="px-4 py-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Searching products...</span>
                            </div>
                          )}

                          <CommandEmpty className="py-8 text-center text-sm text-slate-400">
                            {variantQuery.trim().length < 2
                              ? "Type at least 2 characters to search"
                              : "No products found"}
                          </CommandEmpty>

                          <CommandGroup heading="Available Products">
                            {variantResults.map((v) => (
                              <CommandItem
                                key={v.id}
                                value={`${v.productName} ${v.supplierName} ${v.unit} ${formatCurrency(v.price)}`}
                                onSelect={() => {
                                  setJobProducts((prev) => {
                                    if (
                                      prev.some(
                                        (x) => x.productId === v.productId,
                                      )
                                    )
                                      return prev;
                                    const prod = allProducts.find(
                                      (p) => p.id === v.productId,
                                    );
                                    if (!prod) return prev;
                                    return [
                                      ...prev,
                                      {
                                        productId: prod.id,
                                        productName: prod.name,
                                        required: true,
                                        quantity: null,
                                        unit: `${v.size}${v.unit}`,
                                      },
                                    ];
                                  });
                                  setVariantPickerOpen(false);
                                }}
                                className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                              >
                                <Package className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-slate-200">
                                      {v.productName}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      •
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {v.supplierName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-slate-500">
                                      {v.size}
                                      {v.unit}
                                    </span>
                                    <span className="text-xs font-semibold text-blue-400">
                                      {formatCurrency(v.price)}
                                    </span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}

                            {variantCursor && (
                              <CommandItem
                                value="__load_more_variants__"
                                onSelect={loadMoreVariants}
                                className="justify-center"
                              >
                                <span className="text-sm text-blue-400">
                                  {variantLoading
                                    ? "Loading..."
                                    : "Load more products"}
                                </span>
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </CommandDialog>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setVariantPickerOpen(true)}
                      disabled={loading}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </div>

                <div className="border">
                  <div className="relative max-h-[300px] overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background z-10 border-b">
                        <tr className="text-sm text-muted-foreground">
                          <th className="text-left font-medium p-3 w-[50%]">
                            Product
                          </th>
                          <th className="text-left font-medium p-3 w-[15%]">
                            Usage
                          </th>
                          <th className="text-left font-medium p-3 w-[15%]">
                            Required
                          </th>
                          <th className="text-right font-medium p-3 w-[20%]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobProducts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-8 text-muted-foreground text-sm"
                            >
                              No products assigned yet
                            </td>
                          </tr>
                        ) : (
                          jobProducts.map((jp, idx) => {
                            const product = allProducts.find(
                              (p) => p.id === jp.productId,
                            );
                            const usageType = product?.usageType;

                            let usageLabel = "-";
                            let usageClass =
                              "bg-muted text-muted-foreground border border-muted-foreground/20";

                            if (usageType === "BOTH") {
                              usageLabel = "Ext/Int";
                              usageClass =
                                "bg-purple-200 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-400 dark:border-purple-800";
                            } else if (usageType === "INTERNAL") {
                              usageLabel = "Internal";
                              usageClass =
                                "bg-blue-200 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-400 dark:border-blue-800";
                            } else if (usageType === "EXTERNAL") {
                              usageLabel = "External";
                              usageClass =
                                "bg-amber-200 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-400 dark:border-amber-800";
                            }

                            return (
                              <tr
                                key={`${jp.productId}-${idx}`}
                                className="border-b last:border-0 hover:bg-muted/50"
                              >
                                <td className="p-3 font-medium text-sm">
                                  {jp.productName}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${usageClass}`}
                                  >
                                    {usageLabel}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={jp.required}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setJobProducts((prev) =>
                                          prev.map((p, i) =>
                                            i === idx
                                              ? { ...p, required: checked }
                                              : p,
                                          ),
                                        );
                                      }}
                                      disabled={loading}
                                      className="rounded"
                                    />
                                    <span className="text-sm">Yes</span>
                                  </label>
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setJobProducts((prev) =>
                                        prev.filter((_, i) => i !== idx),
                                      )
                                    }
                                    disabled={loading}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky top-0 px-6 py-4 bg-background border-t flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !jobId}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
