/*
  Warnings:

  - You are about to drop the column `retentionTestId` on the `Class` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_retentionTestId_fkey";

-- DropIndex
DROP INDEX "StudentEnrollment_groupingRationale_idx";

-- DropIndex
DROP INDEX "StudentEnrollment_retentionScore_idx";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "retentionTestId";
