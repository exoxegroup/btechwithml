import { PrismaClient } from '@prisma/client';
import { PerformanceMetricType, EngagementMetricType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Analytics Service Layer for BioLearn AI Phase 4
 * Provides comprehensive group performance tracking, AI algorithm insights,
 * and research-grade analytics for teachers and researchers.
 */

export interface GroupStudentDetail {
  id: string;
  name: string;
  studentId?: string;
  gender: string;
  pretestScore: number | null;
  posttestScore: number | null;
  retentionScore: number | null;
  improvementRate: number;
  retentionRate: number;
  immediateImprovement: number | null; // Pre → Post percentage change
  sustainedImprovement: number | null; // Pre → Retention percentage change
  retentionStability: number | null; // Post → Retention percentage change
  performanceCategory: 'High' | 'Mid' | 'Low';
}

export interface GroupPerformanceData {
  groupId: string;
  classId: string;
  averageScore: number;
  avgPretestScore: number;
  avgPosttestScore: number;
  avgRetentionScore: number;
  improvementRate: number;
  retentionRate: number;
  collaborationScore: number;
  participationRate: number;
  genderBalance: number;
  memberCount: number;
  abilityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  students?: GroupStudentDetail[];
  studentName?: string;
  isIndividual?: boolean;
  label?: string;
  groupingRationale?: string;
  aiGenerated?: boolean;
}

export interface AIAlgorithmInsight {
  effectivenessScore: number;
  genderBalanceScore: number;
  abilityMixScore: number;
  teacherSatisfaction?: number;
  improvementAreas: string[];
  recommendations: string[];
}

export interface ResearchExportOptions {
  exportType: 'GROUP_PERFORMANCE' | 'INDIVIDUAL_PERFORMANCE' | 'LONGITUDINAL_DATA' | 'AI_ALGORITHM_INSIGHTS' | 'COMPREHENSIVE_DATASET';
  fileFormat: 'CSV' | 'JSON' | 'EXCEL';
  anonymizationLevel: 'NONE' | 'PSEUDONYMIZED' | 'ANONYMIZED' | 'AGGREGATED_ONLY';
  dateRange?: {
    start: Date;
    end: Date;
  };
  classIds?: string[];
  includeMetadata?: boolean;
}

/**
 * Calculate comprehensive group performance metrics
 * @param classId - The class ID to analyze
 * @param groupId - The specific group ID (optional, analyzes all groups if not provided)
 * @returns Group performance data with detailed metrics
 */
export async function calculateGroupPerformance(classId: string, groupId?: string): Promise<GroupPerformanceData[]> {
  try {
    // 1. Fetch all groups for the class (with members)
    // If groupId is provided, filter by it.
    const groups = await prisma.group.findMany({
      where: {
        classId,
        ...(groupId && { id: groupId })
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentId: true,
                gender: true
              }
            }
          }
        }
      }
    });

    // 2. Fetch all enrollments (to get scores)
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            gender: true
          }
        }
      }
    });

    // Map studentId -> Enrollment for O(1) score lookup
    const enrollmentMap = new Map<string, typeof enrollments[0]>();
    enrollments.forEach(e => enrollmentMap.set(e.studentId, e));

    const performanceData: GroupPerformanceData[] = [];
    const assignedStudentIds = new Set<string>();

    // 3. Process each group
    for (const group of groups) {
      const groupMembers = group.members;
      const groupEnrollments: typeof enrollments = [];

      const detailedStudents: GroupStudentDetail[] = [];

      for (const member of groupMembers) {
        assignedStudentIds.add(member.studentId);
        const enrollment = enrollmentMap.get(member.studentId);
        
        if (enrollment) {
          groupEnrollments.push(enrollment);

          // Calculate individual stats
          const rawPre = enrollment.pretestScore;
          const rawPost = enrollment.posttestScore;
          const rawRet = enrollment.retentionScore;
          
          const pre = rawPre || 0;
          const post = rawPost || 0;
          const ret = rawRet || post; // Legacy fallback for other calcs if needed, but metrics below use raw

          const impRate = pre > 0 ? ((post - pre) / pre) * 100 : 0;
          const retRate = post > 0 ? (ret / post) * 100 : 100;

          // Calculate the three new improvement metrics with proper null handling
          const immediateImprovement = (rawPre !== null && rawPost !== null && rawPre > 0) 
            ? ((rawPost - rawPre) / rawPre) * 100 
            : null;
            
          const sustainedImprovement = (rawPre !== null && rawRet !== null && rawPre > 0) 
            ? ((rawRet - rawPre) / rawPre) * 100 
            : null;
            
          const retentionStability = (rawPost !== null && rawRet !== null && rawPost > 0) 
            ? ((rawRet - rawPost) / rawPost) * 100 
            : null;

          let perfCat: 'High' | 'Mid' | 'Low' = 'Mid';
          if (pre >= 80) perfCat = 'High';
          else if (pre < 50) perfCat = 'Low';

          detailedStudents.push({
            id: member.student.id,
            name: member.student.name,
            gender: member.student.gender,
            pretestScore: enrollment.pretestScore,
            posttestScore: enrollment.posttestScore,
            retentionScore: enrollment.retentionScore,
            improvementRate: impRate,
            retentionRate: retRate,
            immediateImprovement,
            sustainedImprovement,
            retentionStability,
            performanceCategory: perfCat
          });
        }
      }

      // Calculate Group Averages
      const pretestScores = groupEnrollments.map(e => e.pretestScore).filter(Boolean) as number[];
      const posttestScores = groupEnrollments.map(e => e.posttestScore).filter(Boolean) as number[];
      const retentionScores = groupEnrollments.map(e => e.retentionScore).filter(Boolean) as number[];

      const avgPretest = pretestScores.length > 0 ? pretestScores.reduce((a, b) => a + b, 0) / pretestScores.length : 0;
      const avgPosttest = posttestScores.length > 0 ? posttestScores.reduce((a, b) => a + b, 0) / posttestScores.length : 0;
      const avgRetention = retentionScores.length > 0 ? retentionScores.reduce((a, b) => a + b, 0) / retentionScores.length : avgPosttest;

      const improvementRate = avgPretest > 0 ? ((avgPosttest - avgPretest) / avgPretest) * 100 : 0;
      const retentionRate = avgPosttest > 0 ? (avgRetention / avgPosttest) * 100 : 100;

      // Gender Balance
      const genderCounts = { MALE: 0, FEMALE: 0, OTHER: 0 };
      groupMembers.forEach(m => {
        if (m.student.gender in genderCounts) {
          genderCounts[m.student.gender as keyof typeof genderCounts]++;
        }
      });
      const totalStudents = groupMembers.length;
      const genderBalance = totalStudents > 0 ? 
        1 - (Math.abs(genderCounts.MALE - genderCounts.FEMALE) / totalStudents) : 1;

      // Ability Distribution
      const abilityDistribution = calculateAbilityDistribution(pretestScores);

      performanceData.push({
        groupId: group.id,
        classId,
        averageScore: avgPosttest,
        avgPretestScore: avgPretest,
        avgPosttestScore: avgPosttest,
        avgRetentionScore: avgRetention,
        improvementRate,
        retentionRate,
        collaborationScore: 0.75,
        participationRate: 0.8,
        genderBalance,
        memberCount: totalStudents,
        abilityDistribution,
        students: detailedStudents,
        label: group.name,
        groupingRationale: group.rationale || 'Group-based performance analysis',
        aiGenerated: group.aiGenerated
      });

      // Update metrics in DB (optional, but good for history)
      await storeGroupPerformanceMetrics(classId, group.id, {
        averageScore: avgPosttest,
        improvementRate,
        retentionRate,
        genderBalance,
        abilityDistribution
      });
    }

    // 4. Process Ungrouped Students (if groupId is not specified)
    if (!groupId) {
      const ungroupedEnrollments = enrollments.filter(e => !assignedStudentIds.has(e.studentId));
      
      // Group by groupNumber from StudentEnrollment (Legacy/Manual grouping)
      const manualGroups = new Map<number, typeof enrollments>();
      const trulyUngrouped: typeof enrollments = [];

      for (const e of ungroupedEnrollments) {
        if (e.groupNumber !== null && e.groupNumber !== undefined) {
          if (!manualGroups.has(e.groupNumber)) {
            manualGroups.set(e.groupNumber, []);
          }
          manualGroups.get(e.groupNumber)!.push(e);
        } else {
          trulyUngrouped.push(e);
        }
      }

      // Process Manual Groups
      for (const [groupNum, groupEnrollments] of manualGroups) {
        const detailedStudents: GroupStudentDetail[] = [];
        
        for (const enrollment of groupEnrollments) {
          // Calculate individual stats
          const pre = enrollment.pretestScore || 0;
          const post = enrollment.posttestScore || 0;
          const ret = enrollment.retentionScore || post;
          
          const impRate = pre > 0 ? ((post - pre) / pre) * 100 : 0;
          const retRate = post > 0 ? (ret / post) * 100 : 100;

          // Calculate the three new improvement metrics
          const immediateImprovement = pre > 0 ? ((post - pre) / pre) * 100 : 0;
          const sustainedImprovement = pre > 0 ? ((ret - pre) / pre) * 100 : 0;
          const retentionStability = post > 0 ? ((ret - post) / post) * 100 : 0;

          let perfCat: 'High' | 'Mid' | 'Low' = 'Mid';
          if (pre >= 80) perfCat = 'High';
          else if (pre < 50) perfCat = 'Low';

          detailedStudents.push({
            id: enrollment.student.id,
            name: enrollment.student.name,
            studentId: enrollment.student.studentId || undefined,
            gender: enrollment.student.gender,
            pretestScore: enrollment.pretestScore,
            posttestScore: enrollment.posttestScore,
            retentionScore: enrollment.retentionScore,
            improvementRate: impRate,
            retentionRate: retRate,
            immediateImprovement,
            sustainedImprovement,
            retentionStability,
            performanceCategory: perfCat
          });
        }

        // Calculate Group Averages
        const pretestScores = groupEnrollments.map(e => e.pretestScore).filter(Boolean) as number[];
        const posttestScores = groupEnrollments.map(e => e.posttestScore).filter(Boolean) as number[];
        const retentionScores = groupEnrollments.map(e => e.retentionScore).filter(Boolean) as number[];

        const avgPretest = pretestScores.length > 0 ? pretestScores.reduce((a, b) => a + b, 0) / pretestScores.length : 0;
        const avgPosttest = posttestScores.length > 0 ? posttestScores.reduce((a, b) => a + b, 0) / posttestScores.length : 0;
        const avgRetention = retentionScores.length > 0 ? retentionScores.reduce((a, b) => a + b, 0) / retentionScores.length : avgPosttest;

        const improvementRate = avgPretest > 0 ? ((avgPosttest - avgPretest) / avgPretest) * 100 : 0;
        const retentionRate = avgPosttest > 0 ? (avgRetention / avgPosttest) * 100 : 100;

        // Gender Balance
        const genderCounts = { MALE: 0, FEMALE: 0, OTHER: 0 };
        groupEnrollments.forEach(e => {
          if (e.student.gender in genderCounts) {
            genderCounts[e.student.gender as keyof typeof genderCounts]++;
          }
        });
        const totalStudents = groupEnrollments.length;
        const genderBalance = totalStudents > 0 ? 
          1 - (Math.abs(genderCounts.MALE - genderCounts.FEMALE) / totalStudents) : 1;

        // Ability Distribution
        const abilityDistribution = calculateAbilityDistribution(pretestScores);

        // Try to find a common rationale if possible
        const commonRationale = groupEnrollments.find(e => e.groupingRationale)?.groupingRationale || 'Performance-based grouping';

        performanceData.push({
          groupId: `auto-group-${groupNum}`,
          classId,
          averageScore: avgPosttest,
          avgPretestScore: avgPretest,
          avgPosttestScore: avgPosttest,
          avgRetentionScore: avgRetention,
          improvementRate,
          retentionRate,
          collaborationScore: 0.75,
          participationRate: 0.8,
          genderBalance,
          memberCount: totalStudents,
          abilityDistribution,
          students: detailedStudents,
          label: `Group auto-group-${groupNum}`,
          groupingRationale: commonRationale,
          aiGenerated: false,
          isIndividual: false
        });
      }

      for (const enrollment of trulyUngrouped) {
        // Treat as individual "groups" of size 1
        const pre = enrollment.pretestScore || 0;
        const post = enrollment.posttestScore || 0;
        const ret = enrollment.retentionScore || post;
        
        const impRate = pre > 0 ? ((post - pre) / pre) * 100 : 0;
        const retRate = post > 0 ? (ret / post) * 100 : 100;

        // Calculate the three new improvement metrics with proper null handling
        const rawPre = enrollment.pretestScore;
        const rawPost = enrollment.posttestScore;
        const rawRet = enrollment.retentionScore;

        const immediateImprovement = (rawPre !== null && rawPost !== null && rawPre > 0) 
          ? ((rawPost - rawPre) / rawPre) * 100 
          : null;
          
        const sustainedImprovement = (rawPre !== null && rawRet !== null && rawPre > 0) 
          ? ((rawRet - rawPre) / rawPre) * 100 
          : null;
          
        const retentionStability = (rawPost !== null && rawRet !== null && rawPost > 0) 
          ? ((rawRet - rawPost) / rawPost) * 100 
          : null;

        let perfCat: 'High' | 'Mid' | 'Low' = 'Mid';
        if (pre >= 80) perfCat = 'High';
        else if (pre < 50) perfCat = 'Low';

        const detail: GroupStudentDetail = {
          id: enrollment.student.id,
          name: enrollment.student.name,
          studentId: enrollment.student.studentId || undefined,
          gender: enrollment.student.gender,
          pretestScore: enrollment.pretestScore,
          posttestScore: enrollment.posttestScore,
          retentionScore: enrollment.retentionScore,
          improvementRate: impRate,
          retentionRate: retRate,
          immediateImprovement,
          sustainedImprovement,
          retentionStability,
          performanceCategory: perfCat
        };

        performanceData.push({
          groupId: enrollment.student.id, // Use student ID as group ID for individuals
          classId,
          averageScore: post,
          avgPretestScore: pre,
          avgPosttestScore: post,
          avgRetentionScore: ret,
          improvementRate: impRate,
          retentionRate: retRate,
          collaborationScore: 0,
          participationRate: 0,
          genderBalance: 1,
          memberCount: 1,
          abilityDistribution: {
            high: pre >= 80 ? 1 : 0,
            medium: pre >= 50 && pre < 80 ? 1 : 0,
            low: pre < 50 ? 1 : 0
          },
          students: [detail],
          studentName: enrollment.student.name,
          isIndividual: true,
          label: enrollment.student.name,
          groupingRationale: 'Individual student (not in any group)',
          aiGenerated: false
        });
      }
    }

    return performanceData;

  } catch (error) {
    console.error('Error calculating group performance:', error);
    throw new Error('Failed to calculate group performance metrics');
  }
}

/**
 * Calculate AI algorithm effectiveness and insights
 * @param classId - The class ID to analyze
 * @param aiGroupingId - The specific AI grouping ID to analyze
 * @returns AI algorithm insights with effectiveness scores
 */
export async function calculateAIAlgorithmInsights(classId: string, aiGroupingId?: string): Promise<AIAlgorithmInsight> {
  try {
    // Fetch the most recent AI grouping for the class
    const aiGrouping = await prisma.aIGrouping.findFirst({
      where: {
        classId,
        ...(aiGroupingId && { id: aiGroupingId }),
        status: 'APPLIED'
      },
      orderBy: { appliedAt: 'desc' }
    });

    if (!aiGrouping) {
      // Get current class statistics for basic insights
      const enrollments = await prisma.studentEnrollment.findMany({
        where: { classId },
        include: {
          student: {
            select: { gender: true }
          }
        }
      });

      const totalStudents = enrollments.length;
      const studentsWithPretest = enrollments.filter(e => e.pretestScore !== null).length;
      const studentsWithPosttest = enrollments.filter(e => e.posttestScore !== null).length;
      
      const completionRate = totalStudents > 0 ? (studentsWithPosttest / totalStudents) * 100 : 0;
      const pretestCompletionRate = totalStudents > 0 ? (studentsWithPretest / totalStudents) * 100 : 0;

      return {
        effectivenessScore: 0,
        genderBalanceScore: 0,
        abilityMixScore: 0,
        improvementAreas: [
          `Only ${pretestCompletionRate.toFixed(1)}% of students have completed pre-test`,
          `Only ${completionRate.toFixed(1)}% of students have completed post-test`,
          'No AI grouping has been applied yet',
          totalStudents === 0 ? 'No students enrolled in this class' : `${totalStudents} student(s) enrolled`
        ],
        recommendations: [
          'Apply AI grouping to get personalized group formation recommendations',
          'Ensure all students complete pre and post tests for better analytics',
          'Consider running the grouping algorithm once more students complete tests',
          totalStudents < 3 ? 'Consider enrolling more students for effective group formation' : 'Ready for AI grouping analysis'
        ]
      };
    }

    // Parse grouping data
    const groupingData = aiGrouping.groupingData as any;
    const groups = groupingData.groups || [];

    // Calculate gender balance score across all groups
    let totalGenderBalance = 0;
    let validGroups = 0;

    for (const group of groups) {
      const members = group.members || [];
      if (members.length === 0) continue;

      const genderCounts = {
        MALE: 0,
        FEMALE: 0,
        OTHER: 0
      };

      members.forEach((member: any) => {
        if (member.gender in genderCounts) {
          genderCounts[member.gender as keyof typeof genderCounts]++;
        }
      });

      const totalMembers = members.length;
      const groupGenderBalance = totalMembers > 0 ? 
        1 - (Math.abs(genderCounts.MALE - genderCounts.FEMALE) / totalMembers) : 1;
      
      totalGenderBalance += groupGenderBalance;
      validGroups++;
    }

    const genderBalanceScore = validGroups > 0 ? totalGenderBalance / validGroups : 1;

    // Calculate ability mix score (based on AI rationale)
    const abilityMixScore = analyzeAbilityMixFromRationale(aiGrouping.rationale);

    // Calculate overall effectiveness score (weighted average)
    const effectivenessScore = (genderBalanceScore * 0.4) + (abilityMixScore * 0.6);

    // Generate improvement areas and recommendations
    const improvementAreas = generateImprovementAreas(effectivenessScore, genderBalanceScore, abilityMixScore);
    const recommendations = generateRecommendations(effectivenessScore, genderBalanceScore, abilityMixScore);

    // Store AI insights in database
    await storeAIAlgorithmInsight(classId, aiGrouping.id, {
      effectivenessScore,
      genderBalanceScore,
      abilityMixScore,
      improvementAreas,
      recommendations
    });

    return {
      effectivenessScore,
      genderBalanceScore,
      abilityMixScore,
      improvementAreas,
      recommendations
    };

  } catch (error) {
    console.error('Error calculating AI algorithm insights:', error);
    throw new Error('Failed to calculate AI algorithm insights');
  }
}

/**
 * Generate research data export based on specified options
 * @param options - Export configuration options
 * @param teacherId - The teacher requesting the export
 * @returns Export metadata and download information
 */
export async function generateResearchExport(options: ResearchExportOptions, teacherId: string): Promise<{
  exportId: string;
  downloadUrl: string;
  recordCount: number;
  expiresAt: Date;
}> {
  try {
    // Create export record
    const exportRecord = await prisma.researchDataExport.create({
      data: {
        classId: options.classIds?.[0] || 'multi-class',
        teacherId,
        exportType: options.exportType,
        fileFormat: options.fileFormat,
        anonymizationLevel: options.anonymizationLevel,
        recordCount: 0, // Will be updated after processing
        status: 'PROCESSING',
        metadata: {
          dateRange: options.dateRange,
          classIds: options.classIds,
          includeMetadata: options.includeMetadata
        }
      }
    });

    // Generate the actual data based on export type
    let exportData: any[] = [];
    let recordCount = 0;

    switch (options.exportType) {
      case 'GROUP_PERFORMANCE':
        exportData = await generateGroupPerformanceExport(options);
        break;
      case 'INDIVIDUAL_PERFORMANCE':
        exportData = await generateIndividualPerformanceExport(options);
        break;
      case 'LONGITUDINAL_DATA':
        exportData = await generateLongitudinalDataExport(options);
        break;
      case 'AI_ALGORITHM_INSIGHTS':
        exportData = await generateAIInsightsExport(options);
        break;
      case 'COMPREHENSIVE_DATASET':
        exportData = await generateComprehensiveExport(options);
        break;
      default:
        throw new Error(`Unsupported export type: ${options.exportType}`);
    }

    recordCount = exportData.length;

    // Apply anonymization if requested
    if (options.anonymizationLevel !== 'NONE') {
      exportData = applyAnonymization(exportData, options.anonymizationLevel);
    }

    // Generate file and upload to secure storage (placeholder)
    const fileContent = formatExportData(exportData, options.fileFormat);
    const downloadUrl = await uploadExportFile(exportRecord.id, fileContent, options.fileFormat);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update export record
    await prisma.researchDataExport.update({
      where: { id: exportRecord.id },
      data: {
        recordCount,
        downloadUrl,
        expiresAt,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    console.log(`Successfully generated research export ${exportRecord.id} with ${recordCount} records`);

    return {
      exportId: exportRecord.id,
      downloadUrl,
      recordCount,
      expiresAt
    };

  } catch (error) {
    console.error('Error generating research export:', error);
    throw new Error('Failed to generate research export');
  }
}

/**
 * Helper function to calculate ability distribution
 */
function calculateAbilityDistribution(scores: number[]): { high: number; medium: number; low: number } {
  if (scores.length === 0) {
    return { high: 0, medium: 0, low: 0 };
  }

  // Sort scores and divide into thirds
  const sortedScores = [...scores].sort((a, b) => b - a);
  const third = Math.ceil(sortedScores.length / 3);
  
  const highThreshold = sortedScores[third - 1];
  const lowThreshold = sortedScores[sortedScores.length - third];

  const distribution = scores.reduce((acc, score) => {
    if (score >= highThreshold) acc.high++;
    else if (score <= lowThreshold) acc.low++;
    else acc.medium++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  return distribution;
}

/**
 * Store group performance metrics in database
 */
async function storeGroupPerformanceMetrics(
  classId: string, 
  groupId: string, 
  metrics: Partial<GroupPerformanceData>
) {
  // Check if the group actually exists in the Group table
  const groupExists = await prisma.group.findFirst({
    where: { id: groupId }
  });

  // Skip storing metrics for groups that don't exist in the Group table
  // This handles the case where students are ungrouped (groupNumber: null)
  if (!groupExists) {
    console.log(`Skipping metrics storage for non-existent group ${groupId}`);
    return;
  }

  const metricTypes = [
    { type: PerformanceMetricType.GROUP_AVERAGE_SCORE, value: metrics.averageScore || 0 },
    { type: PerformanceMetricType.GROUP_IMPROVEMENT_RATE, value: metrics.improvementRate || 0 },
    { type: PerformanceMetricType.GROUP_RETENTION_RATE, value: metrics.retentionRate || 0 },
    { type: PerformanceMetricType.GROUP_COLLABORATION_SCORE, value: metrics.collaborationScore || 0 },
    { type: PerformanceMetricType.GROUP_PARTICIPATION_RATE, value: metrics.participationRate || 0 },
    { type: PerformanceMetricType.GROUP_GENDER_BALANCE, value: metrics.genderBalance || 0 }
  ];

  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
  const periodEnd = new Date();

  for (const metric of metricTypes) {
    await prisma.groupPerformanceMetric.create({
      data: {
        classId,
        groupId,
        metricType: metric.type,
        value: metric.value,
        periodStart,
        periodEnd,
        metadata: {
          abilityDistribution: metrics.abilityDistribution
        }
      }
    });
  }
}

/**
 * Store AI algorithm insights in database
 */
async function storeAIAlgorithmInsight(
  classId: string,
  aiGroupingId: string,
  insights: AIAlgorithmInsight
) {
  await prisma.aIAlgorithmInsight.create({
    data: {
      classId,
      aiGroupingId,
      algorithmVersion: '1.0.0', // Would be dynamic in real implementation
      effectivenessScore: insights.effectivenessScore,
      genderBalanceScore: insights.genderBalanceScore,
      abilityMixScore: insights.abilityMixScore,
      teacherSatisfaction: insights.teacherSatisfaction,
      improvementAreas: insights.improvementAreas,
      calculatedAt: new Date()
    }
  });
}

/**
 * Analyze ability mix from AI rationale
 */
function analyzeAbilityMixFromRationale(rationale: string): number {
  // Simple heuristic based on rationale content
  // In a real implementation, this would use NLP to analyze the rationale
  const hasAbilityMix = rationale.toLowerCase().includes('ability') || 
                       rationale.toLowerCase().includes('performance') ||
                       rationale.toLowerCase().includes('mixed');
  
  return hasAbilityMix ? 0.8 : 0.5;
}

/**
 * Generate improvement areas based on scores
 */
function generateImprovementAreas(effectiveness: number, genderBalance: number, abilityMix: number): string[] {
  const areas = [];
  
  if (effectiveness < 0.7) {
    areas.push('Overall algorithm effectiveness needs improvement');
  }
  
  if (genderBalance < 0.8) {
    areas.push('Gender balance across groups could be optimized');
  }
  
  if (abilityMix < 0.7) {
    areas.push('Mixed-ability distribution needs refinement');
  }
  
  if (areas.length === 0) {
    areas.push('Algorithm performance is satisfactory');
  }
  
  return areas;
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(effectiveness: number, genderBalance: number, abilityMix: number): string[] {
  const recommendations = [];
  
  if (effectiveness < 0.7) {
    recommendations.push('Consider adjusting algorithm parameters');
    recommendations.push('Review grouping constraints and criteria');
  }
  
  if (genderBalance < 0.8) {
    recommendations.push('Implement stronger gender balance constraints');
    recommendations.push('Consider group size adjustments');
  }
  
  if (abilityMix < 0.7) {
    recommendations.push('Refine ability categorization logic');
    recommendations.push('Adjust performance distribution thresholds');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring algorithm performance');
    recommendations.push('Maintain current grouping parameters');
  }
  
  return recommendations;
}

/**
 * Generate group performance export data
 */
async function generateGroupPerformanceExport(options: ResearchExportOptions): Promise<any[]> {
  const classIds = options.classIds || [];
  const dateFilter = options.dateRange ? {
    calculatedAt: {
      gte: options.dateRange.start,
      lte: options.dateRange.end
    }
  } : {};

  const metrics = await prisma.groupPerformanceMetric.findMany({
    where: {
      ...(classIds.length > 0 && { classId: { in: classIds } }),
      ...dateFilter
    },
    include: {
      class: {
        select: {
          name: true,
          classCode: true
        }
      },
      group: {
        select: {
          name: true,
          aiGenerated: true
        }
      }
    },
    orderBy: { calculatedAt: 'desc' }
  });

  return metrics.map(metric => ({
    classId: metric.classId,
    className: metric.class.name,
    classCode: metric.class.classCode,
    groupId: metric.groupId,
    groupName: metric.group.name,
    aiGenerated: metric.group.aiGenerated,
    metricType: metric.metricType,
    value: metric.value,
    calculatedAt: metric.calculatedAt,
    periodStart: metric.periodStart,
    periodEnd: metric.periodEnd,
    metadata: metric.metadata
  }));
}

/**
 * Generate individual performance export data
 */
async function generateIndividualPerformanceExport(options: ResearchExportOptions): Promise<any[]> {
  const classIds = options.classIds || [];
  
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      ...(classIds.length > 0 && { classId: { in: classIds } })
    },
    include: {
      class: {
        select: {
          name: true,
          classCode: true
        }
      },
      student: {
        select: {
          name: true,
          gender: true
        }
      }
    }
  });

  return enrollments.map(enrollment => ({
    classId: enrollment.classId,
    className: enrollment.class.name,
    studentId: enrollment.studentId,
    studentName: enrollment.student.name,
    gender: enrollment.student.gender,
    groupNumber: enrollment.groupNumber,
    pretestScore: enrollment.pretestScore,
    posttestScore: enrollment.posttestScore,
    retentionScore: enrollment.retentionScore,
    improvementRate: enrollment.pretestScore && enrollment.posttestScore ? 
      ((enrollment.posttestScore - enrollment.pretestScore) / enrollment.pretestScore) * 100 : null,
    retentionRate: enrollment.posttestScore && enrollment.retentionScore ? 
      (enrollment.retentionScore / enrollment.posttestScore) * 100 : null
  }));
}

/**
 * Generate longitudinal data export
 */
async function generateLongitudinalDataExport(options: ResearchExportOptions): Promise<any[]> {
  const classIds = options.classIds || [];
  
  const longitudinalData = await prisma.longitudinalPerformance.findMany({
    where: {
      ...(classIds.length > 0 && { classId: { in: classIds } })
    },
    include: {
      class: {
        select: {
          name: true,
          classCode: true
        }
      },
      student: {
        select: {
          name: true,
          gender: true
        }
      }
    }
  });

  return longitudinalData.map(record => ({
    studentId: record.studentId,
    studentName: record.student.name,
    gender: record.student.gender,
    classId: record.classId,
    className: record.class.name,
    academicYear: record.academicYear,
    semester: record.semester,
    pretestScore: record.pretestScore,
    posttestScore: record.posttestScore,
    retentionScore: record.retentionScore,
    improvementRate: record.improvementRate,
    retentionRate: record.retentionRate,
    groupingHistory: record.groupingHistory
  }));
}

/**
 * Generate AI insights export data
 */
async function generateAIInsightsExport(options: ResearchExportOptions): Promise<any[]> {
  const classIds = options.classIds || [];
  const dateFilter = options.dateRange ? {
    calculatedAt: {
      gte: options.dateRange.start,
      lte: options.dateRange.end
    }
  } : {};

  const insights = await prisma.aIAlgorithmInsight.findMany({
    where: {
      ...(classIds.length > 0 && { classId: { in: classIds } }),
      ...dateFilter
    },
    include: {
      class: {
        select: {
          name: true,
          classCode: true
        }
      },
      aiGrouping: {
        select: {
          algorithmVersion: true,
          appliedAt: true
        }
      }
    }
  });

  return insights.map(insight => ({
    classId: insight.classId,
    className: insight.class.name,
    aiGroupingId: insight.aiGroupingId,
    algorithmVersion: insight.algorithmVersion,
    effectivenessScore: insight.effectivenessScore,
    genderBalanceScore: insight.genderBalanceScore,
    abilityMixScore: insight.abilityMixScore,
    teacherSatisfaction: insight.teacherSatisfaction,
    improvementAreas: insight.improvementAreas,
    calculatedAt: insight.calculatedAt,
    appliedAt: insight.aiGrouping.appliedAt
  }));
}

/**
 * Generate comprehensive export with all data types
 */
async function generateComprehensiveExport(options: ResearchExportOptions): Promise<any[]> {
  // This would combine all export types into a comprehensive dataset
  // For now, return a summary of available data
  const groupPerformance = await generateGroupPerformanceExport(options);
  const individualPerformance = await generateIndividualPerformanceExport(options);
  const aiInsights = await generateAIInsightsExport(options);

  return [{
    summary: 'Comprehensive Analytics Dataset',
    exportDate: new Date(),
    dataTypes: {
      groupPerformance: groupPerformance.length,
      individualPerformance: individualPerformance.length,
      aiInsights: aiInsights.length
    },
    groupPerformance,
    individualPerformance,
    aiInsights
  }];
}

/**
 * Apply anonymization to export data
 */
function applyAnonymization(data: any[], level: string): any[] {
  switch (level) {
    case 'PSEUDONYMIZED':
      return data.map((record, index) => ({
        ...record,
        studentId: `STUDENT_${index + 1}`,
        studentName: `Student ${index + 1}`,
        classId: `CLASS_${record.classId?.slice(-8) || 'UNKNOWN'}`
      }));
    
    case 'ANONYMIZED':
      return data.map(record => {
        const anonymized = { ...record };
        delete anonymized.studentId;
        delete anonymized.studentName;
        delete anonymized.classId;
        delete anonymized.className;
        return anonymized;
      });
    
    case 'AGGREGATED_ONLY':
      // Return only aggregated statistics
      return [{
        summary: 'Aggregated Statistics',
        recordCount: data.length,
        averageMetrics: calculateAverageMetrics(data)
      }];
    
    default:
      return data;
  }
}

/**
 * Calculate average metrics for aggregated data
 */
function calculateAverageMetrics(data: any[]): any {
  if (data.length === 0) return {};

  const numericFields = ['value', 'effectivenessScore', 'genderBalanceScore', 'abilityMixScore'];
  const averages: any = {};

  numericFields.forEach(field => {
    const values = data.map(item => item[field]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      averages[field] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  });

  return averages;
}

/**
 * Format export data based on file format
 */
function formatExportData(data: any[], format: string): string {
  switch (format) {
    case 'JSON':
      return JSON.stringify(data, null, 2);
    
    case 'CSV':
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          if (Array.isArray(value)) return `"${value.join(';')}"`;
          if (typeof value === 'object' && value !== null) return `"${JSON.stringify(value)}"`;
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value ?? '';
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    
    default:
      return JSON.stringify(data);
  }
}

/**
 * Upload export file to secure storage (placeholder)
 */
async function uploadExportFile(exportId: string, content: string, format: string): Promise<string> {
  // This is a placeholder implementation
  // In a real system, this would upload to secure cloud storage (S3, Google Cloud Storage, etc.)
  // and return a secure, time-limited download URL
  
  const fileName = `export_${exportId}_${Date.now()}.${format.toLowerCase()}`;
  const downloadUrl = `/api/exports/download/${exportId}`;
  
  // Store file content in a temporary location (in-memory for this implementation)
  // In production, this would be uploaded to secure cloud storage
  console.log(`Export file ${fileName} would be uploaded to secure storage`);
  
  return downloadUrl;
}