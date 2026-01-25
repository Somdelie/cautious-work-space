"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  Package,
  Briefcase,
  ShoppingCart,
} from "lucide-react";

import { searchJobsAction, type JobSearchRow } from "@/actions/job-search";
import {
  searchVariantsAction,
  type VariantSearchRow,
} from "@/actions/variant-search";
import { createOrderForJob } from "@/actions/order";
import { formatCurrency } from "@/lib/formatCurrency";

type OrderItemInput = {
  productId: string;
  supplierId: string;
  variantId: string;
  quantity: number;
  label?: string;
  unit?: string;
  price?: number;
};

export function CreateOrderDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);

  // Job picker
  const [jobPickerOpen, setJobPickerOpen] = React.useState(false);
  const [jobQuery, setJobQuery] = React.useState("");
  const [jobResults, setJobResults] = React.useState<JobSearchRow[]>([]);
  const [jobLoading, setJobLoading] = React.useState(false);
  const [jobCursor, setJobCursor] = React.useState<string | null>(null);
  const [job, setJob] = React.useState<JobSearchRow | null>(null);

  // Variant picker
  const [variantPickerOpen, setVariantPickerOpen] = React.useState(false);
  const [variantQuery, setVariantQuery] = React.useState("");
  const [variantResults, setVariantResults] = React.useState<
    VariantSearchRow[]
  >([]);
  const [variantLoading, setVariantLoading] = React.useState(false);
  const [variantCursor, setVariantCursor] = React.useState<string | null>(null);
  const [pickIndex, setPickIndex] = React.useState<number | null>(null);

  // Order form
  const [orderNumber, setOrderNumber] = React.useState("");
  const LOCAL_STORAGE_KEY = "orderDialog.items";
  const [items, setItems] = React.useState<OrderItemInput[]>([
    { productId: "", supplierId: "", variantId: "", quantity: 1 },
  ]);

  // Restore items from localStorage on mount
  React.useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(LOCAL_STORAGE_KEY)
        : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      } catch {}
    }
  }, []);

  // Save items to localStorage whenever they change
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);
  const [saving, setSaving] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setJob(null);
    setOrderNumber("");
    setItems([{ productId: "", supplierId: "", variantId: "", quantity: 1 }]);
    setJobQuery("");
    setJobResults([]);
    setJobCursor(null);
    setJobLoading(false);
    setVariantQuery("");
    setVariantResults([]);
    setVariantCursor(null);
    setVariantLoading(false);
    setPickIndex(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Debounced job search
  React.useEffect(() => {
    if (!jobPickerOpen) return;

    const q = jobQuery.trim();
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setJobResults([]);
        setJobCursor(null);
        return;
      }
      setJobLoading(true);
      try {
        const res = await searchJobsAction({ q, take: 20, cursor: null });
        if (res.success) {
          setJobResults(res.data);
          setJobCursor(res.nextCursor);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to search jobs");
      } finally {
        setJobLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [jobQuery, jobPickerOpen]);

  const loadMoreJobs = React.useCallback(async () => {
    const q = jobQuery.trim();
    if (jobLoading || !jobCursor || q.length < 2) return;
    setJobLoading(true);
    try {
      const res = await searchJobsAction({ q, take: 20, cursor: jobCursor });
      if (res.success) {
        setJobResults((prev) => [...prev, ...res.data]);
        setJobCursor(res.nextCursor);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load more jobs");
    } finally {
      setJobLoading(false);
    }
  }, [jobCursor, jobLoading, jobQuery]);

  // Debounced variant search
  React.useEffect(() => {
    if (!variantPickerOpen) return;

    const q = variantQuery.trim();
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setVariantResults([]);
        setVariantCursor(null);
        return;
      }
      setVariantLoading(true);
      try {
        const res = await searchVariantsAction({ q, take: 20, cursor: null });
        if (res.success) {
          setVariantResults(res.data);
          setVariantCursor(res.nextCursor);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to search products");
      } finally {
        setVariantLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [variantQuery, variantPickerOpen]);

  const loadMoreVariants = React.useCallback(async () => {
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
    } catch (e) {
      console.error(e);
      toast.error("Failed to load more products");
    } finally {
      setVariantLoading(false);
    }
  }, [variantCursor, variantLoading, variantQuery]);

  const applyVariantToRow = (idx: number, v: VariantSearchRow) => {
    setItems((prev) =>
      prev.map((x, i) =>
        i === idx
          ? {
              ...x,
              variantId: v.id,
              productId: v.productId,
              supplierId: v.supplierId,
              label: `${v.productName} • ${v.supplierName}`,
              unit: `${v.size}${v.unit}`,
              price: v.price,
            }
          : x,
      ),
    );
  };

  const submit = async () => {
    if (!job?.id) {
      toast.error("Select a job");
      return;
    }
    if (!orderNumber.trim()) {
      toast.error("Order number is required");
      return;
    }

    const clean = items.filter(
      (x) => x.variantId && x.productId && x.supplierId && x.quantity > 0,
    );
    if (clean.length === 0) {
      toast.error("Add at least 1 product to the order");
      return;
    }

    setSaving(true);
    try {
      const res = await createOrderForJob({
        jobId: job.id,
        orderNumber: orderNumber.trim(),
        items: clean.map(({ productId, supplierId, variantId, quantity }) => ({
          productId,
          supplierId,
          variantId,
          quantity,
        })),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create order");
        return;
      }

      toast.success("Order created successfully");
      setOpen(false);
      resetForm();
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.price || 0) * item.quantity;
  }, 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ShoppingCart className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Create New Order</DialogTitle>
              <p className="text-sm text-slate-400 mt-1">
                Add items to create a purchase order
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Job Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-400" />
              Job Assignment
            </label>

            {job ? (
              <div className="group relative rounded-lg border border-slate-700 bg-linear-to-br from-slate-900 to-slate-950 p-4 transition-all hover:border-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold text-blue-400">
                      {job.jobNumber}
                    </div>
                    <div className="text-sm text-slate-300 truncate">
                      {job.siteName}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setJob(null)}
                    className="h-8 w-8 p-0 hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4 hover:bg-slate-900 border-slate-700"
                onClick={() => setJobPickerOpen(true)}
              >
                <span className="text-slate-400">Select a job...</span>
                <Search className="h-4 w-4 text-slate-500" />
              </Button>
            )}

            <CommandDialog open={jobPickerOpen} onOpenChange={setJobPickerOpen}>
              <Command className="rounded-lg border-slate-800">
                <CommandInput
                  placeholder="Search by job number or site name..."
                  value={jobQuery}
                  onValueChange={setJobQuery}
                  className="border-0 focus:ring-0"
                />
                <CommandList>
                  {jobLoading && (
                    <div className="px-4 py-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Searching jobs...</span>
                    </div>
                  )}

                  <CommandEmpty className="py-8 text-center text-sm text-slate-400">
                    {jobQuery.trim().length < 2
                      ? "Type at least 2 characters to search"
                      : "No jobs found"}
                  </CommandEmpty>

                  <CommandGroup heading="Available Jobs">
                    {jobResults.map((j) => (
                      <CommandItem
                        key={j.id}
                        value={`${j.jobNumber} ${j.siteName}`}
                        onSelect={() => {
                          setJob(j);
                          setJobPickerOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      >
                        <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-mono text-sm font-semibold text-slate-200">
                            {j.jobNumber}
                          </span>
                          <span className="text-xs text-slate-400 truncate">
                            {j.siteName}
                          </span>
                        </div>
                      </CommandItem>
                    ))}

                    {jobCursor && (
                      <CommandItem
                        value="__load_more_jobs__"
                        onSelect={loadMoreJobs}
                        className="justify-center"
                      >
                        <span className="text-sm text-blue-400">
                          {jobLoading ? "Loading..." : "Load more jobs"}
                        </span>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </CommandDialog>
          </div>

          {/* Order Number */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
              Order Number
              <span className="text-red-400">*</span>
            </label>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. PO-6633"
              className="bg-slate-950 border-slate-700 h-11 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                Order Items
              </label>
            </div>

            {/* Product Search */}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-auto py-3 border-dashed border-slate-700 hover:border-slate-600 hover:bg-slate-900"
              onClick={() => {
                setPickIndex(items.length);
                setItems((p) => [
                  ...p,
                  { productId: "", supplierId: "", variantId: "", quantity: 1 },
                ]);
                setVariantPickerOpen(true);
              }}
            >
              <span className="text-slate-400 text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add product to order
              </span>
              <Search className="h-4 w-4 text-slate-500" />
            </Button>

            {/* Items Table */}
            {items.filter((it) => it.variantId).length > 0 && (
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-slate-800">
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                          Product
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                          Supplier
                        </th>
                        <th className="text-center text-xs font-medium text-slate-400 px-4 py-3">
                          Size
                        </th>
                        <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">
                          Unit Price
                        </th>
                        <th className="text-center text-xs font-medium text-slate-400 px-4 py-3 w-28">
                          Qty
                        </th>
                        <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">
                          Line Total
                        </th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        if (!it.variantId) return null;

                        const [productName, supplierName] = it.label?.split(
                          " • ",
                        ) || ["", ""];

                        return (
                          <tr
                            key={idx}
                            className="border-b border-slate-800 hover:bg-slate-900/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-slate-200">
                                {productName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-slate-400">
                                {supplierName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm text-slate-300 font-mono">
                                {it.unit}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm font-semibold text-blue-400">
                                {formatCurrency(it.price ?? 0)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={it.quantity}
                                onChange={(e) => {
                                  const v = Math.max(
                                    1,
                                    Number(e.target.value || 1),
                                  );
                                  setItems((prev) =>
                                    prev.map((x, i) =>
                                      i === idx ? { ...x, quantity: v } : x,
                                    ),
                                  );
                                }}
                                className="bg-slate-950 border-slate-700 h-9 text-center text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm font-semibold text-slate-200">
                                {formatCurrency((it.price || 0) * it.quantity)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setItems((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {items.filter((it) => it.variantId).length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  No items added yet. Click "Add product to order" to get
                  started.
                </p>
              </div>
            )}
          </div>

          {/* Total Summary */}
          {totalAmount > 0 && (
            <div className="rounded-lg border border-blue-500/20 bg-linear-to-br from-blue-950/20 to-slate-950 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Estimated Total
                </span>
                <span className="text-xl font-bold text-blue-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Variant Picker Dialog */}
        <CommandDialog
          open={variantPickerOpen}
          onOpenChange={(v) => {
            setVariantPickerOpen(v);
            if (!v) setPickIndex(null);
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
                      if (pickIndex === null) return;
                      applyVariantToRow(pickIndex, v);
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
                        <span className="text-xs text-slate-500">•</span>
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
                      {variantLoading ? "Loading..." : "Load more products"}
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={saving}
            className="sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
