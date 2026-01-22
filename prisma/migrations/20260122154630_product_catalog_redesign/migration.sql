/*
  Warnings:

  - You are about to drop the column `productTypeId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `productTypeId` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `basis` on the `SpreadRate` table. All the data in the column will be lost.
  - You are about to drop the column `productTypeId` on the `SpreadRate` table. All the data in the column will be lost.
  - You are about to drop the `ProductType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_JobToProductType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_OrderItemToProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[supplierId,productId,size,unit]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `lineTotal` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unitPrice` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantId` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `productId` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `SpreadRate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JobProduct" DROP CONSTRAINT "JobProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductType" DROP CONSTRAINT "ProductType_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productTypeId_fkey";

-- DropForeignKey
ALTER TABLE "SpreadRate" DROP CONSTRAINT "SpreadRate_productTypeId_fkey";

-- DropForeignKey
ALTER TABLE "_JobToProductType" DROP CONSTRAINT "_JobToProductType_A_fkey";

-- DropForeignKey
ALTER TABLE "_JobToProductType" DROP CONSTRAINT "_JobToProductType_B_fkey";

-- DropForeignKey
ALTER TABLE "_OrderItemToProductVariant" DROP CONSTRAINT "_OrderItemToProductVariant_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderItemToProductVariant" DROP CONSTRAINT "_OrderItemToProductVariant_B_fkey";

-- DropIndex
DROP INDEX "ProductVariant_productTypeId_size_unit_key";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "productTypeId",
DROP COLUMN "unit",
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "supplierId" TEXT NOT NULL,
ALTER COLUMN "lineTotal" SET NOT NULL,
ALTER COLUMN "unitPrice" SET NOT NULL,
ALTER COLUMN "variantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "productTypeId",
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "supplierId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SpreadRate" DROP COLUMN "basis",
DROP COLUMN "productTypeId",
ADD COLUMN     "productId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ProductType";

-- DropTable
DROP TABLE "_JobToProductType";

-- DropTable
DROP TABLE "_OrderItemToProductVariant";

-- DropEnum
DROP TYPE "SpreadBasis";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortcut" TEXT,
    "usageType" "UsageType" NOT NULL DEFAULT 'BOTH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("supplierId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE INDEX "SupplierProduct_productId_idx" ON "SupplierProduct"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_supplierId_idx" ON "OrderItem"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_supplierId_productId_size_unit_key" ON "ProductVariant"("supplierId", "productId", "size", "unit");

-- CreateIndex
CREATE INDEX "SpreadRate_productId_idx" ON "SpreadRate"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_supplierId_productId_fkey" FOREIGN KEY ("supplierId", "productId") REFERENCES "SupplierProduct"("supplierId", "productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpreadRate" ADD CONSTRAINT "SpreadRate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProduct" ADD CONSTRAINT "JobProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
