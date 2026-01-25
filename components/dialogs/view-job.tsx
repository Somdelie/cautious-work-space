/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  User,
  Building2,
  Package,
  CheckCircle2,
  Hash,
  MapPin,
  Mail,
  Phone,
  Clock,
  Play,
  RefreshCw,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";
import { getJobById } from "@/actions/job";
import { generateJobOrderPDF } from "@/actions/pdf-export";
import { OrdersTable } from "@/components/orders/orders-table";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { CreateOrderDialog } from "./create-order";

interface ViewJobDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type JobData = {
  id: string;
  jobNumber: string;
  siteName: string;
  client?: string | null;
  isStarted: boolean;
  isFinished: boolean;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  specPdfUrl?: string | null;
  boqPdfUrl?: string | null;
  manager: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  supplier: {
    id: string;
    name: string;
  };
  jobProducts: Array<{
    id: string;
    required: boolean;
    quantity: number | null;
    unit: string | null;
    // productType removed
  }>;
  orders?: Array<{
    id: string;
    orderNumber: string;
    createdAt: Date | string;
    items: Array<{
      id: string;
      quantity: number;
      unit: string;
      // productType removed
    }>;
  }>;
};

export function ViewJobDialog({
  jobId,
  open,
  onOpenChange,
}: ViewJobDialogProps) {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchJob = async () => {
    if (!jobId || !open) {
      setJob(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getJobById(jobId);
      if (result.success && result.data) {
        // Map backend order items to new structure
        const raw = result.data;
        const jobData: JobData = {
          ...raw,
          manager: raw.manager ?? {
            id: "",
            name: "",
            phone: null,
            email: null,
          },
          supplier: raw.supplier ?? { id: "", name: "" },
          jobProducts: Array.isArray(raw.jobProducts)
            ? raw.jobProducts.map((jp: any) => ({
                ...jp,
                quantity:
                  typeof jp.quantity === "object" &&
                  jp.quantity !== null &&
                  typeof jp.quantity.toNumber === "function"
                    ? jp.quantity.toNumber()
                    : jp.quantity,
              }))
            : [],
          orders: Array.isArray(raw.orders)
            ? raw.orders.map((order: any) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                items: Array.isArray(order.items)
                  ? order.items.map((item: any) => ({
                      id: item.id,
                      quantity: item.quantity,
                      unit: item.unit,
                    }))
                  : [],
              }))
            : [],
        };
        if (jobData.startedAt && typeof jobData.startedAt === "string") {
          jobData.startedAt = new Date(jobData.startedAt);
        }
        if (jobData.finishedAt && typeof jobData.finishedAt === "string") {
          jobData.finishedAt = new Date(jobData.finishedAt);
        }
        setJob(jobData);
      } else {
        setError(result.error || "Failed to load job details");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!jobId) return;

    setDownloading(true);
    try {
      const result = await generateJobOrderPDF(jobId);
      if (result.success) {
        // Create blob from base64
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || "job-orders.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("PDF downloaded successfully");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(`Error downloading PDF: ${(err as Error).message}`);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchJob();

    // Refetch when window regains focus (e.g., after marking job as started in another tab/modal)
    const handleFocus = () => {
      if (jobId && open) {
        fetchJob();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [jobId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl min-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl text-slate-100">
              Job Details for{" "}
              <span className="text-primary">{job?.siteName}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {job && job.isStarted && !job.isFinished && (
                <Badge
                  variant="default"
                  className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Ongoing
                </Badge>
              )}
              {job && job.isFinished && (
                <Badge
                  variant="default"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Finished
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading || !job}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100"
                title="Download PDF"
              >
                <Download
                  className={`h-4 w-4 ${downloading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchJob}
                disabled={loading}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100"
                title="Refresh job details"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        )}

        {error && (
          <div className="py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && job && (
          <div className="space-y-5 py-2">
            {/* Basic Information Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
              <h3 className="text-base font-semibold mb-3 text-slate-100 flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-400" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">
                    Job Number
                  </label>
                  <p className="text-sm font-mono font-medium text-slate-100 bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
                    {job.jobNumber}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Site Name
                  </label>
                  <p className="text-sm font-mono font-medium text-slate-100 bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
                    {job.siteName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Client / Company
                  </label>
                  <p className="text-sm font-mono font-medium text-slate-100 bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
                    {job.client || <span className="text-slate-500">—</span>}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created
                  </label>
                  <p className="text-sm font-mono font-medium text-slate-100 bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {job.isStarted && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                      <Play className="h-3 w-3 text-blue-400" />
                      Started
                    </label>
                    <p className="text-sm font-mono font-medium text-slate-100 bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
                      {job.startedAt
                        ? new Date(job.startedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Date not recorded"}
                    </p>
                  </div>
                )}
                {job.isFinished && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Finished
                    </label>
                    <p className="text-sm font-mono font-medium text-slate-100 bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
                      {job.finishedAt
                        ? new Date(job.finishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Date not recorded"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            {(job.specPdfUrl || job.boqPdfUrl) && (
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <h3 className="text-base font-semibold mb-3 text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-400" />
                  Attachments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {job.specPdfUrl && (
                    <div className="flex items-center justify-between border border-slate-700 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            Project Spec
                          </p>
                          <p className="text-xs text-slate-400 break-all">
                            {job.specPdfUrl.split("/").pop()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <a
                            href={job.specPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          title="Delete Spec Attachment"
                          onClick={async () => {
                            // Remove spec attachment from job
                            const res = await fetch("/api/job/attachment", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                jobId: job.id,
                                field: "specPdfUrl",
                              }),
                            });
                            if (res.ok) {
                              toast.success("Spec attachment deleted");
                              window.location.reload();
                            } else {
                              toast.error("Failed to delete spec attachment");
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {job.boqPdfUrl && (
                    <div className="flex items-center justify-between border border-slate-700 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            BOQ
                          </p>
                          <p className="text-xs text-slate-400 break-all">
                            {job.boqPdfUrl.split("/").pop()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <a
                            href={job.boqPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          title="Delete BOQ Attachment"
                          onClick={async () => {
                            // Remove BOQ attachment from job
                            const res = await fetch("/api/job/attachment", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                jobId: job.id,
                                field: "boqPdfUrl",
                              }),
                            });
                            if (res.ok) {
                              toast.success("BOQ attachment deleted");
                              window.location.reload();
                            } else {
                              toast.error("Failed to delete BOQ attachment");
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ordered Totals Section */}
            {job.orders && job.orders.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <h3 className="text-base font-semibold mb-3 text-slate-100 flex items-center gap-2">
                  <div className="h-8 w-8 bg-emerald-500/10 rounded flex items-center justify-center">
                    <Package className="h-4 w-4 text-emerald-400" />
                  </div>
                  Ordered Totals
                  <span className="text-xs font-normal text-slate-400 ml-auto">
                    Aggregated across all orders
                  </span>
                </h3>
                {/* Ordered totals by productType removed; update as needed for new schema */}
              </div>
            )}

            {/* Manager and Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manager Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <h3 className="text-base font-semibold mb-3 text-slate-100 flex items-center gap-2">
                  <div className="h-8 w-8 bg-emerald-500/10 rounded flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-400" />
                  </div>
                  Manager
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {job.manager.name}
                    </p>
                  </div>
                  {job.manager.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{job.manager.email}</span>
                    </div>
                  )}
                  {job.manager.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{job.manager.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <h3 className="text-base font-semibold mb-3 text-slate-100 flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-500/10 rounded flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-purple-400" />
                  </div>
                  Supplier
                </h3>
                <div>
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-sm px-3 py-1"
                  >
                    {job?.supplier?.name}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Product Types Section removed (ProductType deprecated) */}

            {/* Job Products Section */}
            {job.jobProducts && job.jobProducts.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <h3 className="text-base font-semibold mb-3 text-slate-100 flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-500/10 rounded flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  </div>
                  Job Products
                  <span className="text-xs font-normal text-slate-400 ml-auto">
                    {job.jobProducts.length}{" "}
                    {job.jobProducts.length === 1 ? "product" : "products"}
                  </span>
                </h3>
                <div className="border border-slate-700 rounded overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-400">
                            Product Type
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-400">
                            Status
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-400">
                            Quantity
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-400">
                            Unit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {job.jobProducts.map((jobProduct) => (
                          <tr
                            key={jobProduct.id}
                            className="hover:bg-slate-900/30"
                          >
                            <td className="px-3 py-2.5 text-sm font-medium text-slate-200">
                              Product
                            </td>
                            <td className="px-3 py-2.5">
                              {jobProduct.required ? (
                                <Badge
                                  variant="default"
                                  className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-xs px-2 py-0.5"
                                >
                                  Required
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-slate-900/50 text-slate-400 border-slate-600 text-xs px-2 py-0.5"
                                >
                                  Optional
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              {jobProduct.quantity ?? (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              {jobProduct.unit ?? (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Section */}
            {job.orders && (
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-500/10 rounded flex items-center justify-center">
                      <Package className="h-4 w-4 text-indigo-400" />
                    </div>
                    Orders
                    <span className="text-xs font-normal text-slate-400">
                      {job.orders.length}{" "}
                      {job.orders.length === 1 ? "order" : "orders"}
                    </span>
                  </h3>
                  {/* <CreateOrderDialog
                    jobId={job.id}
                    jobNumber={job.jobNumber}
                    onOrderCreated={fetchJob}
                  /> */}
                </div>
                <OrdersTable orders={job.orders} onOrderDeleted={fetchJob} />
              </div>
            )}

            {/* Empty State */}
            {(!job.jobProducts || job.jobProducts.length === 0) && (
              <div className="text-center py-12 bg-slate-800/30 border border-slate-700 rounded">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  No products assigned to this job
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
