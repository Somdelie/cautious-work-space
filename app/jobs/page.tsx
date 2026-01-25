import { getAllJobs } from "@/actions/job";
import JobsDataTable, { type JobRow } from "@/components/jobs/jobs-data-table";

export default async function JobsPage() {
  const result = await getAllJobs();

  const jobs: JobRow[] = (result.data || []).map((job: any) => ({
    id: job.id,
    jobNumber: job.jobNumber,
    siteName: job.siteName,

    manager: job.manager
      ? { id: job.manager.id, name: job.manager.name }
      : null,
    supplier: job.supplier
      ? { id: job.supplier.id, name: job.supplier.name }
      : null,

    isStarted: Boolean(job.isStarted),
    isFinished: Boolean(job.isFinished),
    client: job.client ?? null,

    // your existing UI flags (keep your style)
    specsReceived: Boolean(job.specPdfUrl),
    specNotRequired: Boolean(job.specNotRequired),

    boqReceived: Boolean(job.boqPdfUrl),
    boqNotRequired: Boolean(job.boqNotRequired),

    // your table expects finishingSchedule string|null
    finishingSchedule: job.finishingSchedule ?? null,

    safetyFile: Boolean(job.safetyFile),
    safetyFileNotRequired: Boolean(job.safetyFileNotRequired),

    // ✅ IMPORTANT: client component can receive Date, but to be safe in RSC, send ISO then convert OR keep Date
    // Your JobRow type says Date, so convert:
    createdAt: new Date(job.createdAt),

    // ✅ NEW COLUMN VALUE (ensure number, never Decimal)
    materialCost: Number(job.jobCostSummaries?.[0]?.materialsActual ?? 0),
  }));

  console.log(jobs);

  return (
    <div className="max-w-7xl mx-auto w-full max-h-[calc(100vh-60px)] overflow-hidden">
      <JobsDataTable jobs={jobs} />
    </div>
  );
}
