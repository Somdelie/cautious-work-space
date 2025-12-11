import { getAllJobs, getFinishedJobs } from "@/actions/job";
import { getProductTypes } from "@/actions/product-type";
import { getSuppliers } from "@/actions/supplier";
import { CreateJobDialog } from "@/components/dialogs/create-job";
import { CreateManagerDialog } from "@/components/dialogs/create-manager";
import { CreateProductTypeDialog } from "@/components/dialogs/create-product";
import { CreateSupplierDialog } from "@/components/dialogs/create-supplier";
import {
  Briefcase,
  Users,
  Package,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

export default async function DashboardPage() {
  const jobsResult = await getAllJobs();
  const suppliers = await getSuppliers();
  const productTypes = await getProductTypes();
  const finishedJobs = await getFinishedJobs();

  const totalJobs = jobsResult.success ? jobsResult.data.length : 0;

  return (
    <div className="max-h-[90vh] bg-slate-950/40 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Section */}
        {/* <div className="mb-6 border-b border-slate-800 pb-5">
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">
            Manage your suppliers, managers, jobs, and product types
          </p>
        </div> */}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium mb-1">
                  Total Jobs
                </p>
                <p className="text-2xl font-bold text-slate-100">{totalJobs}</p>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 rounded flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-slate-400">
                Start creating jobs
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium mb-1">
                  Suppliers
                </p>
                <p className="text-2xl font-bold text-slate-100">
                  {suppliers?.data?.length}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-500/10 rounded flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-400">
                Add suppliers first
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium mb-1">
                  Finished Jobs
                </p>
                <p className="text-2xl font-bold text-slate-100">
                  {finishedJobs?.data?.length}
                </p>
              </div>
              <div className="h-10 w-10 bg-emerald-500/10 rounded flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-400">Add team members</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium mb-1">
                  Products Types
                </p>
                <p className="text-2xl font-bold text-slate-100">
                  {productTypes?.data?.length}
                </p>
              </div>
              <div className="h-10 w-10 bg-orange-500/10 rounded flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-400">Configure products</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Suppliers Card */}
          <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-500/10 rounded flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Suppliers
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage your supplier network
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-300 mb-4">
                Add and manage suppliers who provide products for your projects
              </p>
              <CreateSupplierDialog />
            </div>
          </div>

          {/* Managers Card */}
          <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/10 rounded flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Managers
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage your project managers
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-300 mb-4">
                Add managers with contact details to oversee projects
              </p>
              <CreateManagerDialog />
            </div>
          </div>

          {/* Product Types Card */}
          <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-500/10 rounded flex items-center justify-center">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Product Types
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure product catalog
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-300 mb-4">
                Define product types and link them to suppliers
              </p>
              <CreateProductTypeDialog />
            </div>
          </div>

          {/* Jobs Card */}
          <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-500/10 rounded flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Jobs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create and track projects
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-300 mb-4">
                Create jobs and assign managers, suppliers, and products
              </p>
              <CreateJobDialog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
