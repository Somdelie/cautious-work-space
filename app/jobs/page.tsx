import { getAllJobs } from "@/actions/job";
import { CreateJobDialog } from "@/components/dialogs/create-job";
import { JobsDataTable } from "@/components/jobs/jobs-data-table";

export default async function JobsPage() {
  const result = await getAllJobs();

  const jobs = result.data || [];

  return (
    <div className="">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">
              Job Management
            </h1>
            <p className="text-slate-400 text-sm">
              Track and manage all your jobs, suppliers, and managers in one
              place
            </p>
          </div>
          <CreateJobDialog />
        </div>
        <JobsDataTable jobs={jobs} />
      </div>
    </div>
  );
}
