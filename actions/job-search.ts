"use server";

import { prisma } from "@/lib/prisma";

export type JobSearchRow = {
  id: string;
  jobNumber: string;
  siteName: string;
};

export async function searchJobsAction(input: {
  q: string;
  take?: number;
  cursor?: string | null; // use job id cursor
}) {
  const q = (input.q ?? "").trim();
  const take = Math.min(Math.max(input.take ?? 20, 5), 50);

  if (q.length < 2) {
    return {
      success: true as const,
      data: [] as JobSearchRow[],
      nextCursor: null as string | null,
    };
  }

  // Search by jobNumber or siteName (case-insensitive)
  const where = {
    OR: [
      { jobNumber: { contains: q, mode: "insensitive" as const } },
      { siteName: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const jobs = await prisma.job.findMany({
    where,
    select: { id: true, jobNumber: true, siteName: true },
    orderBy: [{ jobNumber: "desc" }, { createdAt: "desc" }],
    take: take + 1,
    ...(input.cursor
      ? {
          cursor: { id: input.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = jobs.length > take;
  const page = hasMore ? jobs.slice(0, take) : jobs;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return { success: true as const, data: page, nextCursor };
}
