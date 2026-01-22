/*
  Warnings:

  - You are about to drop the column `price` on the `ProductType` table. All the data in the column will be lost.
  - You are about to drop the column `price20L` on the `ProductType` table. All the data in the column will be lost.
  - You are about to drop the column `price5L` on the `ProductType` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jobNumber]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jobId,productId]` on the table `JobProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supplierId,type]` on the table `ProductType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MeasureUnit" AS ENUM ('L', 'KG', 'EA');

-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('APP', 'EXCEL');

-- CreateEnum
CREATE TYPE "SpreadBasis" AS ENUM ('PER_M2');

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_managerId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "JobProduct" DROP CONSTRAINT "JobProduct_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobProduct" DROP CONSTRAINT "JobProduct_productId_fkey";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "excelFileName" TEXT,
ADD COLUMN     "excelRowRef" TEXT,
ADD COLUMN     "excelSheetName" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "managerNameRaw" TEXT,
ADD COLUMN     "source" "JobSource" NOT NULL DEFAULT 'APP',
ALTER COLUMN "managerId" DROP NOT NULL,
ALTER COLUMN "supplierId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Manager" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "lineTotal" DOUBLE PRECISION,
ADD COLUMN     "unitPrice" DOUBLE PRECISION,
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "ProductType" DROP COLUMN "price",
DROP COLUMN "price20L",
DROP COLUMN "price5L",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "unit" "MeasureUnit" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpreadRate" (
    "id" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,
    "consumption" DOUBLE PRECISION NOT NULL,
    "unit" "MeasureUnit" NOT NULL,
    "basis" "SpreadBasis" NOT NULL DEFAULT 'PER_M2',
    "perCoat" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpreadRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrderItemToProductVariant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrderItemToProductVariant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productTypeId_size_unit_key" ON "ProductVariant"("productTypeId", "size", "unit");

-- CreateIndex
CREATE INDEX "_OrderItemToProductVariant_B_index" ON "_OrderItemToProductVariant"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JobProduct_jobId_productId_key" ON "JobProduct"("jobId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductType_supplierId_type_key" ON "ProductType"("supplierId", "type");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpreadRate" ADD CONSTRAINT "SpreadRate_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProduct" ADD CONSTRAINT "JobProduct_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProduct" ADD CONSTRAINT "JobProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderItemToProductVariant" ADD CONSTRAINT "_OrderItemToProductVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderItemToProductVariant" ADD CONSTRAINT "_OrderItemToProductVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
