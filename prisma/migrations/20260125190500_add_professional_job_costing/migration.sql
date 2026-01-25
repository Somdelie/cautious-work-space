/*
  Warnings:

  - You are about to alter the column `quantity` on the `JobProduct` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `subtotal` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `quantity` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `lineTotal` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `unitPrice` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `price` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.

*/
-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobCostType" AS ENUM ('MATERIAL_ACTUAL', 'MATERIAL_ESTIMATE', 'LABOR_ACTUAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "JobCostSource" AS ENUM ('ORDER_ITEM', 'JOB_PRODUCT', 'TIMESHEET', 'MANUAL');

-- AlterTable
ALTER TABLE "JobProduct" ADD COLUMN     "estimateUnitPrice" DECIMAL(12,2),
ADD COLUMN     "estimateVariantId" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "lineTotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "JobCostEntry" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "JobCostType" NOT NULL,
    "source" "JobCostSource" NOT NULL,
    "sourceId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCostSummary" (
    "jobId" TEXT NOT NULL,
    "materialsActual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "materialsEstimate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "laborActual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalActual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEstimate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCostSummary_pkey" PRIMARY KEY ("jobId")
);

-- CreateTable
CREATE TABLE "TimesheetEntry" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimesheetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobCostEntry_jobId_type_idx" ON "JobCostEntry"("jobId", "type");

-- CreateIndex
CREATE INDEX "JobCostEntry_source_sourceId_idx" ON "JobCostEntry"("source", "sourceId");

-- CreateIndex
CREATE INDEX "JobCostEntry_createdAt_idx" ON "JobCostEntry"("createdAt");

-- CreateIndex
CREATE INDEX "TimesheetEntry_jobId_date_idx" ON "TimesheetEntry"("jobId", "date");

-- CreateIndex
CREATE INDEX "TimesheetEntry_status_idx" ON "TimesheetEntry"("status");

-- CreateIndex
CREATE INDEX "JobProduct_estimateVariantId_idx" ON "JobProduct"("estimateVariantId");

-- AddForeignKey
ALTER TABLE "JobProduct" ADD CONSTRAINT "JobProduct_estimateVariantId_fkey" FOREIGN KEY ("estimateVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCostEntry" ADD CONSTRAINT "JobCostEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCostSummary" ADD CONSTRAINT "JobCostSummary_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
