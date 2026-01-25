/*
  Warnings:

  - You are about to drop the column `excelFileName` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `excelRowRef` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `excelSheetName` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `importedAt` on the `Job` table. All the data in the column will be lost.
  - The `safetyFile` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "excelFileName",
DROP COLUMN "excelRowRef",
DROP COLUMN "excelSheetName",
DROP COLUMN "importedAt",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "boqNotRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "safetyFileNotRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specNotRequired" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updatedAt" DROP DEFAULT,
DROP COLUMN "safetyFile",
ADD COLUMN     "safetyFile" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
