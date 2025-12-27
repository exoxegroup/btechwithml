-- CreateEnum
CREATE TYPE "PerformanceMetricType" AS ENUM ('GROUP_AVERAGE_SCORE', 'GROUP_IMPROVEMENT_RATE', 'GROUP_RETENTION_RATE', 'GROUP_COLLABORATION_SCORE', 'GROUP_PARTICIPATION_RATE', 'GROUP_GENDER_BALANCE', 'GROUP_ABILITY_DISTRIBUTION');

-- CreateEnum
CREATE TYPE "EngagementMetricType" AS ENUM ('PARTICIPATION_RATE', 'COLLABORATION_FREQUENCY', 'QUESTION_ASKING_RATE', 'HELP_SEEKING_BEHAVIOR', 'HELP_PROVIDING_BEHAVIOR', 'MATERIAL_ACCESS_RATE', 'SESSION_ATTENDANCE');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('GROUP_PERFORMANCE', 'INDIVIDUAL_PERFORMANCE', 'LONGITUDINAL_DATA', 'AI_ALGORITHM_INSIGHTS', 'COMPREHENSIVE_DATASET');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'JSON', 'EXCEL', 'TSV');

-- CreateEnum
CREATE TYPE "AnonymizationLevel" AS ENUM ('NONE', 'PSEUDONYMIZED', 'ANONYMIZED', 'AGGREGATED_ONLY');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AnalyticsSessionType" AS ENUM ('GROUP_PERFORMANCE', 'AI_INSIGHTS', 'LONGITUDINAL_ANALYSIS', 'RESEARCH_EXPORT', 'COMPREHENSIVE_DASHBOARD');

-- CreateTable
CREATE TABLE "GroupPerformanceMetric" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "metricType" "PerformanceMetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "GroupPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAlgorithmInsight" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "aiGroupingId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "effectivenessScore" DOUBLE PRECISION NOT NULL,
    "genderBalanceScore" DOUBLE PRECISION NOT NULL,
    "abilityMixScore" DOUBLE PRECISION NOT NULL,
    "teacherSatisfaction" DOUBLE PRECISION,
    "improvementAreas" TEXT[],
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAlgorithmInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEngagementMetric" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "groupId" TEXT,
    "metricType" "EngagementMetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "sessionStart" TIMESTAMP(3) NOT NULL,
    "sessionEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentEngagementMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongitudinalPerformance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT,
    "pretestScore" DOUBLE PRECISION,
    "posttestScore" DOUBLE PRECISION,
    "retentionScore" DOUBLE PRECISION,
    "improvementRate" DOUBLE PRECISION,
    "retentionRate" DOUBLE PRECISION,
    "groupingHistory" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LongitudinalPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDataExport" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "exportType" "ExportType" NOT NULL,
    "fileFormat" "ExportFormat" NOT NULL,
    "anonymizationLevel" "AnonymizationLevel" NOT NULL DEFAULT 'NONE',
    "recordCount" INTEGER NOT NULL,
    "fileSize" INTEGER,
    "fileHash" TEXT,
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchDataExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "sessionType" "AnalyticsSessionType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "metricsViewed" TEXT[],
    "filtersApplied" JSONB,
    "exportCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupPerformanceMetric_classId_metricType_calculatedAt_idx" ON "GroupPerformanceMetric"("classId", "metricType", "calculatedAt");

-- CreateIndex
CREATE INDEX "GroupPerformanceMetric_groupId_metricType_calculatedAt_idx" ON "GroupPerformanceMetric"("groupId", "metricType", "calculatedAt");

-- CreateIndex
CREATE INDEX "AIAlgorithmInsight_classId_calculatedAt_idx" ON "AIAlgorithmInsight"("classId", "calculatedAt");

-- CreateIndex
CREATE INDEX "AIAlgorithmInsight_aiGroupingId_idx" ON "AIAlgorithmInsight"("aiGroupingId");

-- CreateIndex
CREATE INDEX "AIAlgorithmInsight_algorithmVersion_calculatedAt_idx" ON "AIAlgorithmInsight"("algorithmVersion", "calculatedAt");

-- CreateIndex
CREATE INDEX "StudentEngagementMetric_studentId_classId_metricType_record_idx" ON "StudentEngagementMetric"("studentId", "classId", "metricType", "recordedAt");

-- CreateIndex
CREATE INDEX "StudentEngagementMetric_classId_metricType_recordedAt_idx" ON "StudentEngagementMetric"("classId", "metricType", "recordedAt");

-- CreateIndex
CREATE INDEX "StudentEngagementMetric_groupId_metricType_recordedAt_idx" ON "StudentEngagementMetric"("groupId", "metricType", "recordedAt");

-- CreateIndex
CREATE INDEX "LongitudinalPerformance_studentId_academicYear_idx" ON "LongitudinalPerformance"("studentId", "academicYear");

-- CreateIndex
CREATE INDEX "LongitudinalPerformance_classId_academicYear_idx" ON "LongitudinalPerformance"("classId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "LongitudinalPerformance_studentId_classId_academicYear_key" ON "LongitudinalPerformance"("studentId", "classId", "academicYear");

-- CreateIndex
CREATE INDEX "ResearchDataExport_classId_createdAt_idx" ON "ResearchDataExport"("classId", "createdAt");

-- CreateIndex
CREATE INDEX "ResearchDataExport_teacherId_createdAt_idx" ON "ResearchDataExport"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "ResearchDataExport_status_createdAt_idx" ON "ResearchDataExport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_classId_startTime_idx" ON "AnalyticsSession"("classId", "startTime");

-- CreateIndex
CREATE INDEX "AnalyticsSession_teacherId_startTime_idx" ON "AnalyticsSession"("teacherId", "startTime");

-- CreateIndex
CREATE INDEX "AnalyticsSession_sessionType_startTime_idx" ON "AnalyticsSession"("sessionType", "startTime");

-- AddForeignKey
ALTER TABLE "GroupPerformanceMetric" ADD CONSTRAINT "GroupPerformanceMetric_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPerformanceMetric" ADD CONSTRAINT "GroupPerformanceMetric_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlgorithmInsight" ADD CONSTRAINT "AIAlgorithmInsight_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlgorithmInsight" ADD CONSTRAINT "AIAlgorithmInsight_aiGroupingId_fkey" FOREIGN KEY ("aiGroupingId") REFERENCES "AIGrouping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEngagementMetric" ADD CONSTRAINT "StudentEngagementMetric_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEngagementMetric" ADD CONSTRAINT "StudentEngagementMetric_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEngagementMetric" ADD CONSTRAINT "StudentEngagementMetric_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongitudinalPerformance" ADD CONSTRAINT "LongitudinalPerformance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongitudinalPerformance" ADD CONSTRAINT "LongitudinalPerformance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDataExport" ADD CONSTRAINT "ResearchDataExport_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDataExport" ADD CONSTRAINT "ResearchDataExport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
