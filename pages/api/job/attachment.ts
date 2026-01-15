import { NextApiRequest, NextApiResponse } from "next";
import { updateJob } from "@/actions/job";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { jobId, field } = req.body;
  if (!jobId || (field !== "specPdfUrl" && field !== "boqPdfUrl")) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    const result = await updateJob(jobId, { [field]: null });
    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: "Failed to update job" });
    }
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
