import { Request, Response } from 'express';
import prisma from '../prisma';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/authMiddleware';
import { 
  calculateGroupPerformance, 
  calculateAIAlgorithmInsights,
  generateResearchExport,
  GroupPerformanceData,
  AIAlgorithmInsight,
  ResearchExportOptions
} from '../services/analyticsService';
import { AIGroupingStatus, ExportStatus } from '@prisma/client';

/**
 * Analytics Controller for BioLearn AI Phase 4
 * Handles API endpoints for group performance analytics, AI algorithm insights,
 * and research data exports
 */

/**
 * GET /api/classes/:classId/group-performance
 * Get comprehensive group performance analytics for a specific class
 */
export async function getGroupPerformance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { classId } = req.params;
    const { groupId, includeHistory } = req.query;

    // Verify class exists and user has access
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }
    
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.id
      }
    });

    if (!classExists) {
      res.status(404).json({ success: false, error: 'Class not found or access denied' });
      return;
    }

    // Calculate current performance metrics
    const performanceData = await calculateGroupPerformance(classId, groupId as string);

    // Fetch historical metrics if requested
    let historicalData = [];
    if (includeHistory === 'true') {
      historicalData = await fetchHistoricalGroupMetrics(classId, groupId as string);
    }

    // Calculate class-wide statistics
    const classStats = await calculateClassStatistics(classId);

    const response = {
      classId,
      performanceData,
      historicalData,
      classStats,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in getGroupPerformance:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve group performance data';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * GET /api/classes/:classId/ai-insights
 * Get AI algorithm effectiveness insights and recommendations
 */
export async function getAIInsights(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { classId } = req.params;
    const { aiGroupingId, includeRecommendations } = req.query;

    // Verify class exists and user has access
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }
    
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.id
      }
    });

    if (!classExists) {
      res.status(404).json({ success: false, error: 'Class not found or access denied' });
      return;
    }

    // Calculate AI algorithm insights
    const insights = await calculateAIAlgorithmInsights(classId, aiGroupingId as string);

    // Fetch historical AI insights for trend analysis
    const historicalInsights = await fetchHistoricalAIInsights(classId);

    // Get AI grouping history
    const aiGroupingHistory = await prisma.aIGrouping.findMany({
      where: {
        classId,
        status: 'APPLIED'
      },
      orderBy: { appliedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        algorithmVersion: true,
        appliedAt: true,
        rationale: true
      }
    });

    const response = {
      currentInsights: insights,
      historicalInsights,
      aiGroupingHistory,
      trendAnalysis: calculateTrendAnalysis(historicalInsights),
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in getAIInsights:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve AI insights';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * POST /api/classes/:classId/export-research-data
 * Generate and initiate research data export
 */
export async function exportResearchData(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { classId } = req.params;
    const exportOptions: ResearchExportOptions = req.body;

    // Validate export options
    const validationError = validateExportOptions(exportOptions);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }

    // Verify user is authenticated
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Verify class exists and user has access
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user!.id
      }
    });

    if (!classExists) {
      res.status(404).json({ success: false, error: 'Class not found or access denied' });
      return;
    }

    // Add current class to export options if not specified
    if (!exportOptions.classIds || exportOptions.classIds.length === 0) {
      exportOptions.classIds = [classId];
    }

    // Generate research export
    const exportResult = await generateResearchExport(exportOptions, req.user!.id);

    // Log export activity for audit purposes
    await logExportActivity(req.user!.id, classId, exportOptions, exportResult);

    res.json({
      success: true,
      data: {
        exportId: exportResult.exportId,
        downloadUrl: exportResult.downloadUrl,
        recordCount: exportResult.recordCount,
        expiresAt: exportResult.expiresAt,
        message: 'Research data export initiated successfully'
      }
    });

  } catch (error) {
    console.error('Error in exportResearchData:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to export research data';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * GET /api/exports/:exportId/status
 * Check the status of a research data export
 */
export async function getExportStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { exportId } = req.params;

    // Verify user is authenticated
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Fetch export record
    const exportRecord = await prisma.researchDataExport.findFirst({
      where: {
        id: exportId,
        teacherId: req.user.id // Ensure user owns this export
      },
      select: {
        id: true,
        status: true,
        exportType: true,
        fileFormat: true,
        recordCount: true,
        downloadUrl: true,
        expiresAt: true,
        createdAt: true,
        completedAt: true
      }
    });

    if (!exportRecord) {
      res.status(404).json({ success: false, error: 'Export not found or access denied' });
      return;
    }

    // Check if export has expired
    if (exportRecord.expiresAt && new Date() > exportRecord.expiresAt) {
      // Update status to expired
      await prisma.researchDataExport.update({
        where: { id: exportId },
        data: { status: 'EXPIRED' }
      });
      
      exportRecord.status = 'EXPIRED';
      exportRecord.downloadUrl = null;
    }

    res.json({
      success: true,
      data: exportRecord
    });

  } catch (error) {
    console.error('Error in getExportStatus:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve export status';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * GET /api/exports/download/:exportId
 * Download the generated research data export file
 */
export async function downloadExport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { exportId } = req.params;

    // Verify user is authenticated
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Fetch export record
    const exportRecord = await prisma.researchDataExport.findFirst({
      where: {
        id: exportId,
        teacherId: req.user.id,
        status: 'COMPLETED'
      }
    });

    if (!exportRecord) {
      res.status(404).json({ success: false, error: 'Export not found, access denied, or not completed' });
      return;
    }

    // Check if export has expired
    if (exportRecord.expiresAt && new Date() > exportRecord.expiresAt) {
      res.status(410).json({ success: false, error: 'Export has expired' });
      return;
    }

    // Look for the file in the local exports directory
    const exportsDir = path.join(process.cwd(), 'exports');
    const storedFilename = `${exportId}.${exportRecord.fileFormat.toLowerCase()}`;
    const filePath = path.join(exportsDir, storedFilename);

    if (!fs.existsSync(filePath)) {
      console.error(`Export file not found at ${filePath}`);
      res.status(404).json({ success: false, error: 'Export file not found on server' });
      return;
    }

    const downloadFilename = `research_export_${exportId}.${exportRecord.fileFormat.toLowerCase()}`;
    const contentType = getContentType(exportRecord.fileFormat);

    // Update download count and last accessed
    const currentMetadata = exportRecord.metadata as any || {};
    await prisma.researchDataExport.update({
      where: { id: exportId },
      data: {
        metadata: {
          ...currentMetadata,
          downloadCount: (currentMetadata.downloadCount || 0) + 1,
          lastAccessed: new Date()
        }
      }
    });

    // Stream the file
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      'Cache-Control': 'no-cache'
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error in downloadExport:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to download export file';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * GET /api/analytics/dashboard-summary
 * Get a comprehensive dashboard summary with key metrics
 */
export async function getDashboardSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { classId, timeRange } = req.query;

    // Verify user is authenticated
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Get user's classes
    const classes = await prisma.class.findMany({
      where: {
        teacherId: req.user.id,
        ...(classId && { id: classId as string })
      },
      select: {
        id: true,
        name: true,
        classCode: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            groups: true
          }
        }
      }
    });

    if (classes.length === 0) {
      res.status(404).json({ success: false, error: 'No classes found for user' });
      return;
    }

    const classIds = classes.map(c => c.id);
    
    // Calculate summary statistics
    const summaryStats = await calculateDashboardSummaryStats(classIds, timeRange as string);
    
    // Get recent AI groupings
    const recentAIGroupings = await prisma.aIGrouping.findMany({
      where: {
        classId: { in: classIds },
        status: 'APPLIED'
      },
      orderBy: { appliedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        classId: true,
        algorithmVersion: true,
        appliedAt: true,
        class: {
          select: {
            name: true
          }
        }
      }
    });

    // Get recent exports
    const recentExports = await prisma.researchDataExport.findMany({
      where: {
        teacherId: req.user!.id,
        classId: { in: classIds }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        exportType: true,
        fileFormat: true,
        status: true,
        recordCount: true,
        createdAt: true,
        class: {
          select: {
            name: true
          }
        }
      }
    });

    const response = {
      classes: classes.map(c => ({
        id: c.id,
        name: c.name,
        classCode: c.classCode,
        status: c.status,
        createdAt: c.createdAt,
        studentCount: c._count.enrollments,
        groupCount: c._count.groups
      })),
      summaryStats,
      recentAIGroupings,
      recentExports,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in getDashboardSummary:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve dashboard summary';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * Helper function to fetch historical group metrics
 */
async function fetchHistoricalGroupMetrics(classId: string, groupId?: string): Promise<any[]> {
  const dateFilter = {
    calculatedAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    }
  };

  const metrics = await prisma.groupPerformanceMetric.findMany({
    where: {
      classId,
      ...(groupId && { groupId }),
      ...dateFilter
    },
    orderBy: { calculatedAt: 'desc' },
    select: {
      metricType: true,
      value: true,
      calculatedAt: true,
      periodStart: true,
      periodEnd: true,
      metadata: true
    }
  });

  return metrics;
}

/**
 * Helper function to fetch historical AI insights
 */
async function fetchHistoricalAIInsights(classId: string): Promise<any[]> {
  const insights = await prisma.aIAlgorithmInsight.findMany({
    where: {
      classId
    },
    orderBy: { calculatedAt: 'desc' },
    take: 20,
    select: {
      effectivenessScore: true,
      genderBalanceScore: true,
      abilityMixScore: true,
      teacherSatisfaction: true,
      calculatedAt: true,
      algorithmVersion: true
    }
  });

  return insights;
}

/**
 * Helper function to calculate class statistics
 */
async function calculateClassStatistics(classId: string): Promise<any> {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { classId },
    select: {
      pretestScore: true,
      posttestScore: true,
      retentionScore: true,
      groupNumber: true
    }
  });

  const totalStudents = enrollments.length;
  const studentsWithPretest = enrollments.filter(e => e.pretestScore !== null).length;
  const studentsWithPosttest = enrollments.filter(e => e.posttestScore !== null).length;
  const studentsWithRetention = enrollments.filter(e => e.retentionScore !== null).length;

  const pretestScores = enrollments.map(e => e.pretestScore).filter(Boolean) as number[];
  const posttestScores = enrollments.map(e => e.posttestScore).filter(Boolean) as number[];
  const retentionScores = enrollments.map(e => e.retentionScore).filter(Boolean) as number[];

  const avgPretest = pretestScores.length > 0 ? pretestScores.reduce((a, b) => a + b, 0) / pretestScores.length : 0;
  const avgPosttest = posttestScores.length > 0 ? posttestScores.reduce((a, b) => a + b, 0) / posttestScores.length : 0;
  const avgRetention = retentionScores.length > 0 ? retentionScores.reduce((a, b) => a + b, 0) / retentionScores.length : 0;

  const groupedStudents = enrollments.filter(e => e.groupNumber !== null).length;
  const uniqueGroups = new Set(enrollments.map(e => e.groupNumber).filter(Boolean)).size;

  return {
    totalStudents,
    studentsWithPretest,
    studentsWithPosttest,
    studentsWithRetention,
    completionRates: {
      pretest: totalStudents > 0 ? (studentsWithPretest / totalStudents) * 100 : 0,
      posttest: totalStudents > 0 ? (studentsWithPosttest / totalStudents) * 100 : 0,
      retention: totalStudents > 0 ? (studentsWithRetention / totalStudents) * 100 : 0
    },
    averageScores: {
      pretest: avgPretest,
      posttest: avgPosttest,
      retention: avgRetention
    },
    improvementRate: avgPretest > 0 ? ((avgPosttest - avgPretest) / avgPretest) * 100 : 0,
    retentionRate: avgPosttest > 0 ? (avgRetention / avgPosttest) * 100 : 100,
    groupingStats: {
      groupedStudents,
      uniqueGroups,
      groupingRate: totalStudents > 0 ? (groupedStudents / totalStudents) * 100 : 0
    }
  };
}

/**
 * GET /api/analytics/class/:classId/student-engagement
 * Get student engagement metrics for a specific class
 */
export async function getStudentEngagement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { classId } = req.params;
    const { metricType, timeRange, groupBy } = req.query;

    // Verify user is authenticated
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Verify class exists and user has access
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.id
      }
    });

    if (!classExists) {
      res.status(404).json({ success: false, error: 'Class not found or access denied' });
      return;
    }

    // Calculate date filter based on time range
    let dateFilter = {};
    if (timeRange) {
      const now = new Date();
      const timeRangeMs = parseTimeRange(timeRange as string);
      if (timeRangeMs) {
        dateFilter = {
          recordedAt: {
            gte: new Date(now.getTime() - timeRangeMs)
          }
        };
      }
    }

    // Build where clause for engagement metrics
    const whereClause: any = {
      classId,
      ...dateFilter
    };

    if (metricType) {
      whereClause.metricType = metricType;
    }

    // Fetch engagement metrics
    const engagementMetrics = await prisma.studentEngagementMetric.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            gender: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        recordedAt: 'desc'
      }
    });

    // Process metrics based on grouping
    let processedMetrics = engagementMetrics;
    if (groupBy === 'student') {
      processedMetrics = groupMetricsByStudent(engagementMetrics);
    } else if (groupBy === 'metricType') {
      processedMetrics = groupMetricsByType(engagementMetrics);
    }

    // Calculate summary statistics
    const summaryStats = calculateEngagementSummary(engagementMetrics);

    const response = {
      classId,
      metrics: processedMetrics,
      summaryStats,
      totalRecords: engagementMetrics.length,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in getStudentEngagement:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve student engagement data';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * GET /api/analytics/class/:classId/performance-data
 * Get aggregated performance data for charts and visualizations
 * Uses only saved records from database (no real-time updates)
 */
export async function getPerformanceData(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { classId } = req.params;
    const { chartType, groupBy } = req.query;

    console.log(`Fetching performance data for class ${classId} (chart: ${chartType}, group: ${groupBy})`);

    // Verify user is authenticated
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Verify class exists and user has access
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.id
      }
    });

    if (!classExists) {
      res.status(404).json({ success: false, error: 'Class not found or access denied' });
      return;
    }

    // Get aggregated group performance data using saved records only
    const performanceData = await calculateGroupPerformance(classId);

    // Transform data based on chart type and grouping
    let chartData: any[] = performanceData;
    
    console.log('Performance data from service:', JSON.stringify(performanceData, null, 2));
    
    if (chartType === 'line') {
      // Calculate member counts for all groups first
      console.log('Calculating member counts for line chart...');
      const memberCounts = await Promise.all(
        performanceData.map(async (group) => {
          try {
            if (group.isIndividual) {
              console.log(`Group ${group.groupId} is individual, memberCount = 1`);
              return 1;
            } else {
              const count = await prisma.studentEnrollment.count({
                where: {
                  classId: classId,
                  groupNumber: parseInt(group.groupId)
                }
              });
              console.log(`Group ${group.groupId} memberCount = ${count}`);
              return count;
            }
          } catch (error) {
            console.error(`Error calculating member count for group ${group.groupId}:`, error);
            return 0; // Fallback to 0 if calculation fails
          }
        })
      );
      
      console.log('All member counts:', memberCounts);
      
      // Prepare data for line chart (trend over groups)
      chartData = performanceData.map((group, index) => ({
        ...group,
        groupIndex: index + 1,
        label: group.isIndividual ? group.studentName : `Group ${group.groupId}`,
        memberCount: memberCounts[index]
      }));
      console.log('Line chart data:', JSON.stringify(chartData, null, 2));
    } else if (chartType === 'bar') {
      // Prepare data for bar chart (comparison across groups)
      console.log('Calculating member counts for bar chart...');
      const memberCounts = await Promise.all(
        performanceData.map(async (group) => {
          try {
            if (group.isIndividual) {
              console.log(`Group ${group.groupId} is individual, memberCount = 1`);
              return 1;
            } else {
              const count = await prisma.studentEnrollment.count({
                where: {
                  classId: classId,
                  groupNumber: parseInt(group.groupId)
                }
              });
              console.log(`Group ${group.groupId} memberCount = ${count}`);
              return count;
            }
          } catch (error) {
            console.error(`Error calculating member count for group ${group.groupId}:`, error);
            return 0; // Fallback to 0 if calculation fails
          }
        })
      );
      
      console.log('All member counts for bar chart:', memberCounts);
      
      chartData = performanceData.map((group, index) => ({
        groupId: group.groupId,
        groupName: group.isIndividual ? group.studentName : `Group ${group.groupId}`,
        studentName: group.studentName,
        isIndividual: group.isIndividual,
        groupingRationale: group.groupingRationale,
        pretestScore: group.avgPretestScore,
        posttestScore: group.avgPosttestScore,
        retentionScore: group.avgRetentionScore,
        improvementRate: group.improvementRate,
        retentionRate: group.retentionRate,
        memberCount: memberCounts[index]
      }));
      console.log('Bar chart data:', JSON.stringify(chartData, null, 2));
    } else {
      // Default case - add memberCount to all groups for consistency
      console.log('Default chart type, adding memberCount to all groups...');
      const memberCounts = await Promise.all(
        performanceData.map(async (group) => {
          try {
            if (group.isIndividual) {
              console.log(`Group ${group.groupId} is individual, memberCount = 1`);
              return 1;
            } else {
              const count = await prisma.studentEnrollment.count({
                where: {
                  classId: classId,
                  groupNumber: parseInt(group.groupId)
                }
              });
              console.log(`Group ${group.groupId} memberCount = ${count}`);
              return count;
            }
          } catch (error) {
            console.error(`Error calculating member count for group ${group.groupId}:`, error);
            return 0;
          }
        })
      );
      
      chartData = performanceData.map((group, index) => ({
        ...group,
        memberCount: memberCounts[index]
      }));
      console.log('Default chart data:', JSON.stringify(chartData, null, 2));
    }

    // Calculate summary statistics for the entire class
    const summaryStats = await calculateClassStatistics(classId);

    const response = {
      classId,
      chartData,
      summaryStats,
      totalGroups: performanceData.length,
      dataSource: 'saved_records', // Explicitly indicate this uses saved records only
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in getPerformanceData:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve performance data';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

/**
 * Helper function to parse time range string to milliseconds
 */
function parseTimeRange(timeRange: string): number | null {
  const timeRanges: Record<string, number> = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000
  };
  
  return timeRanges[timeRange] || null;
}

/**
 * Helper function to group metrics by student
 */
function groupMetricsByStudent(metrics: any[]): any[] {
  const studentMap = new Map<string, any[]>();
  
  metrics.forEach(metric => {
    const studentId = metric.student.id;
    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, []);
    }
    studentMap.get(studentId)!.push(metric);
  });
  
  return Array.from(studentMap.entries()).map(([studentId, studentMetrics]) => {
    const student = studentMetrics[0].student;
    const avgEngagement = studentMetrics.reduce((sum, m) => sum + m.value, 0) / studentMetrics.length;
    
    return {
      studentId,
      studentName: student.name,
      studentGender: student.gender,
      averageEngagement: avgEngagement,
      metricCount: studentMetrics.length,
      metrics: studentMetrics
    };
  });
}

/**
 * Helper function to group metrics by type
 */
function groupMetricsByType(metrics: any[]): any[] {
  const typeMap = new Map<string, any[]>();
  
  metrics.forEach(metric => {
    const type = metric.metricType;
    if (!typeMap.has(type)) {
      typeMap.set(type, []);
    }
    typeMap.get(type)!.push(metric);
  });
  
  return Array.from(typeMap.entries()).map(([metricType, typeMetrics]) => {
    const avgValue = typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length;
    
    return {
      metricType,
      averageValue: avgValue,
      metricCount: typeMetrics.length,
      metrics: typeMetrics
    };
  });
}

/**
 * Helper function to calculate engagement summary statistics
 */
function calculateEngagementSummary(metrics: any[]): any {
  if (metrics.length === 0) {
    return {
      totalStudents: 0,
      averageEngagement: 0,
      engagementByType: {},
      topEngagedStudents: [],
      lowEngagedStudents: []
    };
  }
  
  const uniqueStudents = new Set(metrics.map(m => m.student.id));
  const totalStudents = uniqueStudents.size;
  const avgEngagement = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  
  // Calculate engagement by type
  const engagementByType: Record<string, { count: number; average: number }> = {};
  metrics.forEach(metric => {
    const type = metric.metricType;
    if (!engagementByType[type]) {
      engagementByType[type] = { count: 0, average: 0 };
    }
    engagementByType[type].count++;
    engagementByType[type].average = (engagementByType[type].average * (engagementByType[type].count - 1) + metric.value) / engagementByType[type].count;
  });
  
  // Find top and low engaged students
  const studentEngagement = Array.from(uniqueStudents).map(studentId => {
    const studentMetrics = metrics.filter(m => m.student.id === studentId);
    const avgValue = studentMetrics.reduce((sum, m) => sum + m.value, 0) / studentMetrics.length;
    return {
      studentId,
      studentName: studentMetrics[0].student.name,
      averageEngagement: avgValue,
      metricCount: studentMetrics.length
    };
  });
  
  const topEngagedStudents = studentEngagement
    .sort((a, b) => b.averageEngagement - a.averageEngagement)
    .slice(0, 5);
    
  const lowEngagedStudents = studentEngagement
    .sort((a, b) => a.averageEngagement - b.averageEngagement)
    .slice(0, 5);
  
  return {
    totalStudents,
    averageEngagement: avgEngagement,
    engagementByType,
    topEngagedStudents,
    lowEngagedStudents
  };
}

/**
 * Helper function to calculate trend analysis
 */
function calculateTrendAnalysis(historicalInsights: any[]): any {
  if (historicalInsights.length < 2) {
    return { trend: 'insufficient_data', message: 'Need more data for trend analysis' };
  }

  const recent = historicalInsights.slice(0, 5);
  const older = historicalInsights.slice(5, 10);

  const avgRecent = recent.reduce((acc, insight) => ({
    effectiveness: acc.effectiveness + insight.effectivenessScore,
    genderBalance: acc.genderBalance + insight.genderBalanceScore,
    abilityMix: acc.abilityMix + insight.abilityMixScore
  }), { effectiveness: 0, genderBalance: 0, abilityMix: 0 });

  const avgOlder = older.reduce((acc, insight) => ({
    effectiveness: acc.effectiveness + insight.effectivenessScore,
    genderBalance: acc.genderBalance + insight.genderBalanceScore,
    abilityMix: acc.abilityMix + insight.abilityMixScore
  }), { effectiveness: 0, genderBalance: 0, abilityMix: 0 });

  const recentCount = recent.length;
  const olderCount = older.length;

  const recentEffectiveness = avgRecent.effectiveness / recentCount;
  const olderEffectiveness = avgOlder.effectiveness / olderCount;

  const trend = recentEffectiveness > olderEffectiveness ? 'improving' : 
                recentEffectiveness < olderEffectiveness ? 'declining' : 'stable';

  return {
    trend,
    recentAverage: {
      effectiveness: recentEffectiveness,
      genderBalance: avgRecent.genderBalance / recentCount,
      abilityMix: avgRecent.abilityMix / recentCount
    },
    olderAverage: {
      effectiveness: olderEffectiveness,
      genderBalance: avgOlder.genderBalance / olderCount,
      abilityMix: avgOlder.abilityMix / olderCount
    }
  };
}

/**
 * Helper function to validate export options
 */
function validateExportOptions(options: ResearchExportOptions): string | null {
  const validExportTypes = ['GROUP_PERFORMANCE', 'INDIVIDUAL_PERFORMANCE', 'LONGITUDINAL_DATA', 'AI_ALGORITHM_INSIGHTS', 'COMPREHENSIVE_DATASET'];
  const validFormats = ['CSV', 'JSON', 'EXCEL'];
  const validAnonymization = ['NONE', 'PSEUDONYMIZED', 'ANONYMIZED', 'AGGREGATED_ONLY'];

  if (!validExportTypes.includes(options.exportType)) {
    return `Invalid export type. Must be one of: ${validExportTypes.join(', ')}`;
  }

  if (!validFormats.includes(options.fileFormat)) {
    return `Invalid file format. Must be one of: ${validFormats.join(', ')}`;
  }

  if (!validAnonymization.includes(options.anonymizationLevel)) {
    return `Invalid anonymization level. Must be one of: ${validAnonymization.join(', ')}`;
  }

  if (options.dateRange && options.dateRange.start > options.dateRange.end) {
    return 'Invalid date range: start date must be before end date';
  }

  return null;
}

/**
 * Helper function to log export activity
 */
async function logExportActivity(teacherId: string, classId: string, options: ResearchExportOptions, result: any): Promise<void> {
  await prisma.analyticsSession.create({
    data: {
      classId,
      teacherId,
      sessionType: 'RESEARCH_EXPORT',
      duration: 0, // Will be calculated when session ends
      metricsViewed: [options.exportType],
      exportCount: 1
    }
  });
}

/**
 * Helper function to get content type for file format
 */
function getContentType(format: string): string {
  switch (format) {
    case 'CSV': return 'text/csv';
    case 'JSON': return 'application/json';
    case 'EXCEL': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return 'application/octet-stream';
  }
}

/**
 * Helper function to generate sample export content
 */
function generateSampleExportContent(exportType: string, format: string): string {
  const sampleData = {
    exportInfo: {
      type: exportType,
      format: format,
      generatedAt: new Date().toISOString(),
      recordCount: 100,
      disclaimer: 'This is sample data for demonstration purposes'
    },
    data: [
      { id: 1, name: 'Sample Record 1', value: 85.5 },
      { id: 2, name: 'Sample Record 2', value: 92.3 },
      { id: 3, name: 'Sample Record 3', value: 78.9 }
    ]
  };

  if (format === 'CSV') {
    return 'id,name,value\n1,Sample Record 1,85.5\n2,Sample Record 2,92.3\n3,Sample Record 3,78.9';
  } else {
    return JSON.stringify(sampleData, null, 2);
  }
}

/**
 * Helper function to calculate dashboard summary statistics
 */
async function calculateDashboardSummaryStats(classIds: string[], timeRange?: string): Promise<any> {
  const dateFilter = timeRange ? {
    createdAt: {
      gte: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000)
    }
  } : {};

  // Get enrollment statistics
  const enrollmentStats = await prisma.studentEnrollment.groupBy({
    by: ['classId'],
    where: {
      classId: { in: classIds }
    },
    _count: {
      id: true
    },
    _avg: {
      pretestScore: true,
      posttestScore: true,
      retentionScore: true
    }
  });

  // Get AI grouping statistics
  const aiGroupingStats = await prisma.aIGrouping.groupBy({
    by: ['status'],
    where: {
      classId: { in: classIds },
      ...dateFilter
    },
    _count: {
      id: true
    }
  });

  // Get export statistics
  const exportStats = await prisma.researchDataExport.groupBy({
    by: ['status'],
    where: {
      teacherId: classIds[0] // This needs to be adjusted based on actual teacher ID
    },
    _count: {
      id: true
    }
  });

  return {
    totalStudents: enrollmentStats.reduce((sum, stat) => sum + stat._count.id, 0),
    averagePretestScore: enrollmentStats.reduce((sum, stat) => sum + (stat._avg.pretestScore || 0), 0) / enrollmentStats.length,
    averagePosttestScore: enrollmentStats.reduce((sum, stat) => sum + (stat._avg.posttestScore || 0), 0) / enrollmentStats.length,
    averageRetentionScore: enrollmentStats.reduce((sum, stat) => sum + (stat._avg.retentionScore || 0), 0) / enrollmentStats.length,
    aiGroupingCounts: aiGroupingStats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {}),
    exportCounts: exportStats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {})
  };
}