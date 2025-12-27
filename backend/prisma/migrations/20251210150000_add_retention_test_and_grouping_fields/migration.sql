-- Migration: Add retention test and grouping rationale fields
-- Created: 2025-12-10 15:00 UTC

-- Add RETENTION_TEST to QuizType enum
ALTER TYPE "QuizType" ADD VALUE IF NOT EXISTS 'RETENTION_TEST';

-- Add retentionTest relation to Class model
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "retentionTestId" TEXT;
ALTER TABLE "Class" ADD CONSTRAINT "Class_retentionTestId_fkey" FOREIGN KEY ("retentionTestId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add retentionTestForClass relation to Quiz model
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "classId_retentionTest" TEXT;
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_classId_retentionTest_key" UNIQUE ("classId_retentionTest");
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_classId_retentionTest_fkey" FOREIGN KEY ("classId_retentionTest") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add retentionScore and groupingRationale to StudentEnrollment
ALTER TABLE "StudentEnrollment" ADD COLUMN IF NOT EXISTS "retentionScore" DOUBLE PRECISION;
ALTER TABLE "StudentEnrollment" ADD COLUMN IF NOT EXISTS "groupingRationale" TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "StudentEnrollment_retentionScore_idx" ON "StudentEnrollment"("retentionScore");
CREATE INDEX IF NOT EXISTS "StudentEnrollment_groupingRationale_idx" ON "StudentEnrollment"("groupingRationale");

-- Verify migration success
SELECT 
  'QuizType enum updated' as status,
  EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RETENTION_TEST' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'QuizType')) as success;

SELECT 
  'Class retentionTest relation added' as status,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Class' AND column_name = 'retentionTestId') as success;

SELECT 
  'Quiz retentionTestForClass relation added' as status,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quiz' AND column_name = 'classId_retentionTest') as success;

SELECT 
  'StudentEnrollment fields added' as status,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'StudentEnrollment' AND column_name = 'retentionScore') as success;