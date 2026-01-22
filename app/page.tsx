import { getAllJobs, getFinishedJobs } from "@/actions/job";
import { getSuppliers } from "@/actions/supplier";
import { CreateJobDialog } from "@/components/dialogs/create-job";
import { CreateManagerDialog } from "@/components/dialogs/create-manager";
import { CreateSupplierDialog } from "@/components/dialogs/create-supplier";
import { DownloadUserGuide } from "@/components/common/download-user-guide";
import {
  Briefcase,
  Users,
  Package,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getProductsCount } from "@/actions/product";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");

  const [jobsResult, suppliersResult, productsCountResult, finishedJobsResult] =
    await Promise.all([
      getAllJobs(),
      getSuppliers(),
      getProductsCount(),
      getFinishedJobs(),
    ]);

  const totalJobs =
    jobsResult.success && jobsResult.data ? jobsResult.data.length : 0;
  const suppliersCount =
    suppliersResult.success && suppliersResult.data
      ? suppliersResult.data.length
      : 0;
  const productsCount = productsCountResult.success
    ? productsCountResult.count
    : 0;
  const finishedJobsCount =
    finishedJobsResult.success && finishedJobsResult.data
      ? finishedJobsResult.data.length
      : 0;

  return (
    <div className="max-h-[90vh] bg-slate-950/40 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Jobs"
            value={totalJobs}
            hint="Create and track projects"
            icon={<Briefcase className="h-5 w-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
          />
          <StatCard
            label="Suppliers"
            value={suppliersCount}
            hint="Maintain supplier catalog"
            icon={<Building2 className="h-5 w-5 text-purple-500" />}
            iconBg="bg-purple-500/10"
          />
          <StatCard
            label="Finished Jobs"
            value={finishedJobsCount}
            hint="Jobs marked complete"
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
          />
          <StatCard
            label="Products"
            value={productsCount}
            hint="Products + variants + prices"
            icon={<Package className="h-5 w-5 text-orange-500" />}
            iconBg="bg-orange-500/10"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Suppliers"
            description="Create suppliers and manage their product pricing (variants)."
            icon={<Building2 className="h-5 w-5 text-purple-500" />}
            iconBg="bg-purple-500/10"
          >
            <CreateSupplierDialog />
          </ActionCard>

          <ActionCard
            title="Managers"
            description="Add managers and assign them to jobs."
            icon={<Users className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
          >
            <CreateManagerDialog />
          </ActionCard>

          <ActionCard
            title="Product Catalog"
            description="Products are global. Pricing is per supplier via variants (20L, 5L, 25kg…)."
            icon={<Package className="h-5 w-5 text-orange-500" />}
            iconBg="bg-orange-500/10"
          >
            {/* Replace with your new dialog/page */}
            {/* <CreateProductDialog /> */}
            <div className="text-xs text-slate-400">
              Build: Products → Supplier Products → Variants
            </div>
          </ActionCard>

          <ActionCard
            title="Jobs"
            description="Create jobs and track progress, documents, and orders."
            icon={<Briefcase className="h-5 w-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
          >
            <CreateJobDialog />
          </ActionCard>
        </div>

        {/* User Guide */}
        <div className="mt-6 bg-linear-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-1">
                Need Help?
              </h3>
              <p className="text-sm text-slate-400">
                Download the user guide for the Job Management System.
              </p>
            </div>
            <DownloadUserGuide />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
        <div
          className={`h-10 w-10 ${iconBg} rounded flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3">
        <TrendingUp className="h-3 w-3 text-emerald-500" />
        <span className="text-xs text-slate-400">{hint}</span>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  iconBg,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 ${iconBg} rounded flex items-center justify-center`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
