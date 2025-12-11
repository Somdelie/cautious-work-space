import { Search, Filter } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full space-y-4 bg-slate-950 text-slate-100 p-6 min-h-screen">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <div className="h-10 w-full pl-9 bg-slate-900 border border-slate-800 rounded" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 w-full sm:w-[180px] bg-slate-900 border border-slate-800 rounded flex items-center px-3">
            <Filter className="mr-2 h-4 w-4 text-slate-500" />
            <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="w-full">
          {/* Table Header */}
          <div className="border-b border-slate-800">
            <div className="flex">
              {[120, 150, 140, 120, 180, 100, 60].map((width, i) => (
                <div
                  key={i}
                  className="p-4 text-left font-semibold"
                  style={{ width: `${width}px` }}
                >
                  <div
                    className="h-4 bg-slate-700 rounded animate-pulse"
                    style={{ width: `${width - 40}px` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Table Body - Skeleton Rows */}
          <div>
            {[...Array(10)].map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="border-b border-slate-800 last:border-0"
              >
                <div className="flex">
                  {/* Job Number */}
                  <div className="p-4" style={{ width: "120px" }}>
                    <div className="h-5 w-20 bg-slate-700 rounded animate-pulse" />
                  </div>

                  {/* Site Name */}
                  <div className="p-4" style={{ width: "150px" }}>
                    <div className="h-5 w-28 bg-slate-700 rounded animate-pulse" />
                  </div>

                  {/* Manager */}
                  <div className="p-4" style={{ width: "140px" }}>
                    <div className="space-y-1.5">
                      <div className="h-5 w-24 bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Supplier */}
                  <div className="p-4" style={{ width: "120px" }}>
                    <div className="h-6 w-20 bg-slate-700 rounded-full animate-pulse" />
                  </div>

                  {/* Products */}
                  <div className="p-4" style={{ width: "180px" }}>
                    <div className="flex flex-wrap gap-1">
                      <div className="h-6 w-16 bg-slate-700 rounded animate-pulse" />
                      <div className="h-6 w-20 bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="p-4" style={{ width: "100px" }}>
                    <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
                  </div>

                  {/* Actions */}
                  <div className="p-4" style={{ width: "60px" }}>
                    <div className="h-8 w-8 bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="h-5 w-40 bg-slate-700 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 bg-slate-900 border border-slate-800 rounded" />
          <div className="h-5 w-24 bg-slate-700 rounded animate-pulse" />
          <div className="h-9 w-16 bg-slate-900 border border-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
}
