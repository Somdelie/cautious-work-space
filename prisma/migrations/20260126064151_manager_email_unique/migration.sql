/*
  Warnings:

  - You are about to drop the column `estimateVariantId` on the `JobProduct` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `SpreadRate` table. All the data in the column will be lost.
  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `Manager` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productOptionId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `SpreadRate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JobProduct" DROP CONSTRAINT "JobProduct_estimateVariantId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_supplierId_productId_fkey";

-- DropIndex
DROP INDEX "JobProduct_estimateVariantId_idx";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "excelFileName" TEXT,
ADD COLUMN     "excelRowRef" TEXT,
ADD COLUMN     "excelSheetName" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "JobProduct" DROP COLUMN "estimateVariantId",
ADD COLUMN     "estimateProductOptionId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "variantId",
ADD COLUMN     "productOptionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SpreadRate" DROP COLUMN "unit",
ADD COLUMN     "unitId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ProductVariant";

-- DropEnum
DROP TYPE "MeasureUnit";

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantOption" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unitId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOption" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierVariantPrice" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productOptionId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierVariantPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE INDEX "ProductVariantOption_unitId_idx" ON "ProductVariantOption"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantOption_value_unitId_key" ON "ProductVariantOption"("value", "unitId");

-- CreateIndex
CREATE INDEX "ProductOption_productId_idx" ON "ProductOption"("productId");

-- CreateIndex
CREATE INDEX "ProductOption_optionId_idx" ON "ProductOption"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOption_productId_optionId_key" ON "ProductOption"("productId", "optionId");

-- CreateIndex
CREATE INDEX "SupplierVariantPrice_supplierId_idx" ON "SupplierVariantPrice"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierVariantPrice_productId_idx" ON "SupplierVariantPrice"("productId");

-- CreateIndex
CREATE INDEX "SupplierVariantPrice_productOptionId_idx" ON "SupplierVariantPrice"("productOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierVariantPrice_supplierId_productOptionId_key" ON "SupplierVariantPrice"("supplierId", "productOptionId");

-- CreateIndex
CREATE INDEX "JobProduct_estimateProductOptionId_idx" ON "JobProduct"("estimateProductOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_email_key" ON "Manager"("email");

-- CreateIndex
CREATE INDEX "Order_jobId_idx" ON "Order"("jobId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productOptionId_idx" ON "OrderItem"("productOptionId");

-- CreateIndex
CREATE INDEX "SpreadRate_unitId_idx" ON "SpreadRate"("unitId");

-- CreateIndex
CREATE INDEX "TimesheetEntry_approvedBy_idx" ON "TimesheetEntry"("approvedBy");

-- AddForeignKey
ALTER TABLE "ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductVariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierVariantPrice" ADD CONSTRAINT "SupplierVariantPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierVariantPrice" ADD CONSTRAINT "SupplierVariantPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierVariantPrice" ADD CONSTRAINT "SupplierVariantPrice_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpreadRate" ADD CONSTRAINT "SpreadRate_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProduct" ADD CONSTRAINT "JobProduct_estimateProductOptionId_fkey" FOREIGN KEY ("estimateProductOptionId") REFERENCES "ProductOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "ProductOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
