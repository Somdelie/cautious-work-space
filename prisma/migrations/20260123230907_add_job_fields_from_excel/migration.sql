-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "dateRequested" TIMESTAMP(3),
ADD COLUMN     "finishingSchedule" TEXT,
ADD COLUMN     "loa" TEXT,
ADD COLUMN     "pointers" TEXT,
ADD COLUMN     "safetyFile" TEXT,
ADD COLUMN     "specsReceived" BOOLEAN NOT NULL DEFAULT false;
