/*
  Warnings:

  - The values [OVERRIDDEN] on the enum `AIGroupingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INACTIVE] on the enum `ClassStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[studentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AIGroupingStatus_new" AS ENUM ('PENDING', 'APPLIED', 'REJECTED');
ALTER TABLE "AIGrouping" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AIGrouping" ALTER COLUMN "status" TYPE "AIGroupingStatus_new" USING ("status"::text::"AIGroupingStatus_new");
ALTER TYPE "AIGroupingStatus" RENAME TO "AIGroupingStatus_old";
ALTER TYPE "AIGroupingStatus_new" RENAME TO "AIGroupingStatus";
DROP TYPE "AIGroupingStatus_old";
ALTER TABLE "AIGrouping" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ClassStatus_new" AS ENUM ('ACTIVE', 'MAIN_SESSION', 'GROUP_SESSION', 'POSTTEST', 'COMPLETED');
ALTER TABLE "Class" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Class" ALTER COLUMN "status" TYPE "ClassStatus_new" USING ("status"::text::"ClassStatus_new");
ALTER TYPE "ClassStatus" RENAME TO "ClassStatus_old";
ALTER TYPE "ClassStatus_new" RENAME TO "ClassStatus";
DROP TYPE "ClassStatus_old";
ALTER TABLE "Class" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "classEndedAt" TIMESTAMP(3),
ADD COLUMN     "retentionTestDelayMinutes" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "studentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");
