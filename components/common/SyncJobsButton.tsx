'use client';
import { use, useState } from "react";

export function SyncJobsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/sync/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync request failed");
      setResult(data.message || "Sync request sent. The office agent will process jobs soon.");
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleSync} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? "Syncing..." : "Sync Jobs"}
      </button>
      {error && <div className="text-red-600 mt-2">Error: {error}</div>}
      {result && (
        <div className="bg-gray-100 p-2 mt-2 rounded text-xs max-h-64 overflow-auto">
          {result}
        </div>
      )}
    </div>
  );
}
