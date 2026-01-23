"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type JobWithRelations = Awaited<
  ReturnType<
    typeof prisma.job.findMany<{
      include: {
        manager: true;
        supplier: true;
        jobProducts: {
          include: {
            product: true;
          };
        };
      };
    }>
  >
>[number];

type GetAllJobsResult = {
  success: boolean;
  data: JobWithRelations[] | null;
  error: unknown | null;
};

export async function getAllJobs(): Promise<GetAllJobsResult> {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        manager: true,
        supplier: true,
        jobProducts: { include: { product: true } },
        orders: {
          include: {
            items: {
              include: {
                product: true,
                supplier: true,
                variant: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Sort jobs: ongoing jobs first (isStarted=true, isFinished=false), then others
    const sortedJobs = [...jobs].sort(
      (a: JobWithRelations, b: JobWithRelations) => {
        // Ongoing jobs (started but not finished) come first
        const aIsOngoing = a.isStarted && !a.isFinished;
        const bIsOngoing = b.isStarted && !b.isFinished;

        if (aIsOngoing && !bIsOngoing) return -1;
        if (!aIsOngoing && bIsOngoing) return 1;

        // If both are ongoing or both are not, maintain createdAt order (newest first)
        return 0;
      },
    );

    return {
      success: true,
      data: sortedJobs,
      error: null,
    };
  } catch (error: unknown) {
    return {
      error: error,
      data: null,
      success: false,
    };
  }
}

export async function getFinishedJobs() {
  try {
    const jobs = await prisma.job.findMany({
      where: { isFinished: true },
    });
    return { success: true, data: jobs };
  } catch {
    return { success: false, error: "Failed to fetch finished jobs" };
  }
}

// get jobs by supplier id
export async function getJobsBySupplierId(supplierId: string) {
  try {
    const jobs = await prisma.job.findMany({
      where: { supplierId },
    });
    return { success: true, data: jobs };
  } catch {
    return { success: false, error: "Failed to fetch jobs by supplier id" };
  }
}

// get jobs by manager id
export async function getJobsByManagerId(managerId: string) {
  try {
    const jobs = await prisma.job.findMany({
      where: { managerId },
    });
    return { success: true, data: jobs };
  } catch {
    return { success: false, error: "Failed to fetch jobs by manager id" };
  }
}

export async function createJob(data: {
  jobNumber: string;
  siteName: string;
  client?: string;
  managerId?: string;
  supplierId?: string;
  specPdfUrl?: string;
  boqPdfUrl?: string;
}) {
  const job = await prisma.job.create({
    data: {
      jobNumber: data.jobNumber,
      siteName: data.siteName,
      client: data.client,
      managerId: data.managerId ?? null,
      supplierId: data.supplierId ?? null,
      specPdfUrl: data.specPdfUrl,
      boqPdfUrl: data.boqPdfUrl,
    },
    include: {
      manager: true,
      supplier: true,
      jobProducts: { include: { product: true } },
    },
  });

  revalidatePath("/jobs");
  return { success: true, data: job };
}

export async function getJobById(id: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        manager: true,
        supplier: true,
        jobProducts: {
          include: {
            product: true,
          },
        },
        orders: {
          include: {
            items: {
              include: {
                product: true,
                supplier: true,
                variant: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    return { success: true, data: job };
  } catch {
    return { success: false, error: "Failed to fetch job" };
  }
}

export async function updateJob(
  id: string,
  data: {
    jobNumber?: string;
    siteName?: string;
    client?: string | null;
    managerId?: string | null;
    supplierId?: string | null;
    specPdfUrl?: string | null;
    boqPdfUrl?: string | null;

    // ✅ NEW
    isStarted?: boolean;
    isFinished?: boolean;
  },
) {
  try {
    const updateData: any = {
      jobNumber: data.jobNumber,
      siteName: data.siteName,
      client: data.client ?? undefined,
      managerId: data.managerId ?? undefined,
      supplierId: data.supplierId ?? undefined,
      specPdfUrl: data.specPdfUrl ?? undefined,
      boqPdfUrl: data.boqPdfUrl ?? undefined,
    };

    // ✅ status logic (keep timestamps consistent)
    if (typeof data.isStarted === "boolean") {
      updateData.isStarted = data.isStarted;
      updateData.startedAt = data.isStarted ? new Date() : null;

      // if you unstart a job, also unfinish it
      if (!data.isStarted) {
        updateData.isFinished = false;
        updateData.finishedAt = null;
      }
    }

    if (typeof data.isFinished === "boolean") {
      updateData.isFinished = data.isFinished;

      if (data.isFinished) {
        // finishing implies started
        updateData.isStarted = true;
        updateData.startedAt = updateData.startedAt ?? new Date();
        updateData.finishedAt = new Date();
      } else {
        updateData.finishedAt = null;
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        manager: true,
        supplier: true,
        jobProducts: { include: { product: true } },
      },
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${id}`);
    return { success: true, data: job };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to update job" };
  }
}

export async function setJobProducts(
  jobId: string,
  payload: {
    items: Array<{
      productId: string;
      required?: boolean;
      quantity?: number | null;
      unit?: string | null;
    }>;
  },
) {
  try {
    // basic validation
    const clean = (payload.items ?? [])
      .filter((x) => x.productId)
      .map((x) => ({
        productId: x.productId,
        required: Boolean(x.required),
        quantity:
          x.quantity === null || x.quantity === undefined
            ? null
            : Number(x.quantity),
        unit: x.unit ? String(x.unit).trim() || null : null,
      }));

    await prisma.$transaction(async (tx) => {
      // replace-mode (simple + reliable)
      await tx.jobProduct.deleteMany({ where: { jobId } });

      if (clean.length) {
        await tx.jobProduct.createMany({
          data: clean.map((x) => ({
            jobId,
            productId: x.productId,
            required: x.required,
            quantity: x.quantity,
            unit: x.unit,
          })),
        });
      }
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to update job products" };
  }
}


export async function deleteJob(id: string) {
  try {
    await prisma.job.delete({
      where: { id },
    });
    revalidatePath("/jobs");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete job" };
  }
}

export async function markJobAsStarted(id: string) {
  try {
    const job = await prisma.job.update({
      where: { id },
      data: {
        isStarted: true,
        startedAt: new Date(),
      },
    });
    revalidatePath("/jobs");
    revalidatePath("/");
    return { success: true, data: job };
  } catch {
    return { success: false, error: "Failed to mark job as started" };
  }
}

export async function markJobAsFinished(id: string) {
  try {
    const job = await prisma.job.update({
      where: { id },
      data: {
        isStarted: true,
        isFinished: true,
        finishedAt: new Date(),
      },
    });
    revalidatePath("/jobs");
    revalidatePath("/");
    return { success: true, data: job };
  } catch {
    return { success: false, error: "Failed to mark job as finished" };
  }
}
