"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

type JobWithRelations = Prisma.JobGetPayload<{
  include: {
    manager: true;
    supplier: true;
    productTypes: true;
    jobProducts: {
      include: {
        productType: true;
      };
    };
  };
}>;

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
        productTypes: true,
        jobProducts: {
          include: {
            productType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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
      }
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
  managerId: string;
  supplierId: string;
  productTypeIds?: string[];
}) {
  try {
    const job = await prisma.job.create({
      data: {
        jobNumber: data.jobNumber,
        siteName: data.siteName,
        managerId: data.managerId,
        supplierId: data.supplierId,
        productTypes:
          data.productTypeIds && data.productTypeIds.length > 0
            ? {
                connect: data.productTypeIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        manager: true,
        supplier: true,
        productTypes: true,
        jobProducts: {
          include: {
            productType: true,
          },
        },
      },
    });
    revalidatePath("/jobs");
    return { success: true, data: job };
  } catch {
    return { success: false, error: "Failed to create job" };
  }
}

export async function getJobById(id: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        manager: true,
        supplier: true,
        productTypes: true,
        jobProducts: {
          include: {
            productType: true,
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
    managerId?: string;
    supplierId?: string;
    productTypeIds?: string[];
  }
) {
  try {
    const updateData: {
      jobNumber?: string;
      siteName?: string;
      managerId?: string;
      supplierId?: string;
      productTypes?: { set: Array<{ id: string }> };
    } = {
      jobNumber: data.jobNumber,
      siteName: data.siteName,
      managerId: data.managerId,
      supplierId: data.supplierId,
    };

    // Update product types if provided
    if (data.productTypeIds !== undefined) {
      updateData.productTypes = {
        set: data.productTypeIds.map((id) => ({ id })),
      };
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        manager: true,
        supplier: true,
        productTypes: true,
        jobProducts: {
          include: {
            productType: true,
          },
        },
      },
    });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${id}`);
    return { success: true, data: job };
  } catch {
    return { success: false, error: "Failed to update job" };
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
