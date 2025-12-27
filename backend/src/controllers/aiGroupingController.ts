import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateAIGrouping, generateFallbackGrouping, generateManualGrouping, validateGrouping, AIGroupingResult, DEFAULT_CONSTRAINTS, GroupingConstraints } from '../services/aiGroupingService';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Generate AI-powered student groups for a class
 * POST /api/classes/:classId/ai-grouping
 */
export const generateAIGroups = async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  let teacherId: string;
  let groupCount: number | undefined;
  
  try {
    teacherId = req.user!.id;
    
    // Debug logging
    console.log('AI Grouping Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('AI Grouping Request Body:', req.body);

    // Parse groupCount safely (handle string or number)
    if (req.body?.groupCount !== undefined && req.body?.groupCount !== null) {
      const parsedCount = parseInt(String(req.body.groupCount), 10);
      if (!isNaN(parsedCount) && parsedCount > 0) {
        groupCount = parsedCount;
      }
    }
    
    console.log(`Parsed groupCount: ${groupCount} (type: ${typeof groupCount})`);
    
    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: { 
        id: classId,
        teacherId 
      }
    });

    if (!classData) {
      return res.status(403).json({ 
        error: 'Access denied. You can only generate groups for your own classes.' 
      });
    }

    // Check if class has enough students
    const enrollmentCount = await prisma.studentEnrollment.count({
      where: { classId }
    });

    if (enrollmentCount < 3) {
      return res.status(400).json({ 
        error: 'Class must have at least 3 students for grouping',
        details: {
          message: `Currently only ${enrollmentCount} student(s) enrolled. At least 3 students are required to create meaningful groups with high (H), medium (M), and low (L) performers.`,
          currentCount: enrollmentCount,
          minimumRequired: 3
        }
      });
    }

    if (enrollmentCount < 8) {
      return res.status(400).json({ 
        error: 'Class must have at least 8 students for AI grouping',
        details: {
          message: `Currently ${enrollmentCount} students enrolled. AI grouping requires at least 8 students for optimal balance. For classes with 3-7 students, use manual grouping instead.`,
          currentCount: enrollmentCount,
          minimumRequired: 8,
          suggestion: 'Consider manual grouping for smaller classes'
        }
      });
    }

    // Check if all students have completed the pretest
    const studentsWithoutPretest = await prisma.studentEnrollment.findMany({
      where: { 
        classId,
        pretestScore: null
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (studentsWithoutPretest.length > 0) {
      const studentNames = studentsWithoutPretest.map(e => e.student.name).join(', ');
      return res.status(400).json({ 
        error: 'Cannot generate groups until all students complete the pretest',
        details: {
          message: `${studentsWithoutPretest.length} students have not taken the pretest`,
          students: studentsWithoutPretest.map(e => ({
            id: e.student.id,
            name: e.student.name,
            email: e.student.email
          }))
        }
      });
    }

    // Calculate constraints based on requested group count
    let constraints: GroupingConstraints = DEFAULT_CONSTRAINTS;
    
    if (groupCount && groupCount > 0) {
      // Calculate target group size based on total students and requested groups
      // e.g., 8 students / 4 groups = 2 students per group
      const targetSize = Math.floor(enrollmentCount / groupCount);
      const minSize = Math.max(2, targetSize); // Ensure at least 2 students per group
      // Allow slight flexibility, but keep it close to target
      const maxSize = Math.ceil(enrollmentCount / groupCount) + 1;
      
      constraints = {
        ...DEFAULT_CONSTRAINTS,
        minGroupSize: minSize,
        maxGroupSize: maxSize
      };
      
      console.log(`Using custom constraints for ${groupCount} groups:`, constraints);
    }

    // Generate AI grouping
    const groupingResult = await generateAIGrouping(classId, constraints);
    
    // Store the AI grouping result in database (without applying it yet)
    const aiGroupingRecord = await prisma.aIGrouping.create({
      data: {
        classId,
        teacherId,
        groupingData: groupingResult as any,
        rationale: groupingResult.rationale,
        algorithmVersion: groupingResult.algorithmVersion,
        status: 'PENDING',
        createdAt: new Date()
      }
    });

    res.json({
      ...groupingResult,
      groupingId: aiGroupingRecord.id,
      success: true,
      message: 'AI grouping generated successfully. Review and apply when ready.'
    });

  } catch (error) {
    console.error('Generate AI Groups Error:', error);
    
    // Log detailed error to file for debugging
    try {
      const logPath = path.resolve(__dirname, '../../ai-grouping-error.log');
      const errorMsg = `${new Date().toISOString()} - Class: ${classId} - Error: ${error instanceof Error ? error.message : String(error)}\nStack: ${error instanceof Error ? error.stack : 'No stack'}\n\n`;
      fs.appendFileSync(logPath, errorMsg);
    } catch (logError) {
      console.error('Failed to write to error log:', logError);
    }
    
    // Check if it's an AI service error (rate limit, quota exceeded, etc.)
    if (error instanceof Error && 
        (error.message.includes('RESOURCE_EXHAUSTED') || 
         error.message.includes('rate limit') ||
         error.message.includes('quota exceeded') ||
         error.message.includes('Failed to generate') ||
         error.message.includes('Invalid or empty response') ||
         error.message.includes('fetch failed') ||
         error.message.includes('ECONNREFUSED'))) {
      
      try {
        // Re-get the classId and teacherId from request since we're in catch block
        const fallbackClassId = req.params.classId;
        const fallbackTeacherId = req.user!.id;
        
        // Use fallback grouping algorithm with requested group count
        const fallbackResult = await generateFallbackGrouping(fallbackClassId, groupCount);
        
        // Store the fallback grouping result in database
        const fallbackGroupingRecord = await prisma.aIGrouping.create({
          data: {
            classId: fallbackClassId,
            teacherId: fallbackTeacherId,
            groupingData: fallbackResult as any,
            rationale: fallbackResult.rationale,
            algorithmVersion: fallbackResult.algorithmVersion,
            status: 'PENDING',
            createdAt: new Date()
          }
        });

        return res.json({
          ...fallbackResult,
          groupingId: fallbackGroupingRecord.id,
          success: true,
          message: 'AI grouping generated using fallback algorithm due to service limitations. Review and apply when ready.',
          fallback: true,
          originalError: error.message // Add this for debugging
        });
        
      } catch (fallbackError) {
        console.error('Fallback grouping also failed:', fallbackError);
        return res.status(500).json({ 
          error: 'Both AI and fallback grouping failed. Please try again later or use manual grouping.' 
        });
      }
    }
    
    if (error instanceof Error) {
      if (error.message.includes('No students enrolled')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to generate AI groups. Please try again later.' 
    });
  }
};

/**
 * Get AI grouping rationale and details
 * GET /api/classes/:classId/grouping-rationale/:groupingId
 */
export const getGroupingRationale = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, groupingId } = req.params;
    const teacherId = req.user!.id;
    
    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: { 
        id: classId,
        teacherId 
      }
    });

    if (!classData) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view grouping rationale for your own classes.' 
      });
    }

    // Fetch the AI grouping record
    const aiGrouping = await prisma.aIGrouping.findFirst({
      where: {
        id: groupingId,
        classId,
        teacherId
      }
    });

    if (!aiGrouping) {
      return res.status(404).json({ 
        error: 'AI grouping not found or access denied' 
      });
    }

    res.json({
      success: true,
      rationale: aiGrouping.rationale,
      groupingData: aiGrouping.groupingData,
      algorithmVersion: aiGrouping.algorithmVersion,
      createdAt: aiGrouping.createdAt,
      status: aiGrouping.status
    });

  } catch (error) {
    console.error('Get Grouping Rationale Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve grouping rationale' 
    });
  }
};

/**
 * Apply or override AI-generated groups
 * PUT /api/classes/:classId/groups
 */
export const applyGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user!.id;
    const { groupingId, groups, override = false } = req.body;
    
    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: { 
        id: classId,
        teacherId 
      }
    });

    if (!classData) {
      return res.status(403).json({ 
        error: 'Access denied. You can only manage groups for your own classes.' 
      });
    }

    // If using AI grouping, verify it exists and fetch it
    let groupingData = groups;
    let rationale = 'Manual grouping applied by teacher';
    
    if (groupingId && !override) {
      const aiGrouping = await prisma.aIGrouping.findFirst({
        where: {
          id: groupingId,
          classId,
          teacherId,
          status: 'PENDING'
        }
      });

      if (!aiGrouping) {
        return res.status(404).json({ 
          error: 'AI grouping not found or already applied' 
        });
      }

      groupingData = aiGrouping.groupingData as any;
      rationale = aiGrouping.rationale;
      
      // Update AI grouping status
      await prisma.aIGrouping.update({
        where: { id: groupingId },
        data: { status: 'APPLIED', appliedAt: new Date() }
      });
    }

    // Delete existing groups for this class
    await prisma.group.deleteMany({
      where: { classId }
    });

    // Create new groups and student assignments
    const createdGroups = [];
    
    for (let i = 0; i < groupingData.groups.length; i++) {
      const group = groupingData.groups[i];
      
      // Create the group
      const newGroup = await prisma.group.create({
        data: {
          classId,
          name: group.name,
          aiGenerated: !!groupingId && !override,
          rationale: group.rationale || rationale,
          createdAt: new Date()
        }
      });

      // Create student assignments and update enrollment
      for (const student of group.students) {
        
        // Create group member record
        await prisma.groupMember.create({
          data: {
            groupId: newGroup.id,
            studentId: student.id,
            assignedAt: new Date()
          }
        });
        
        // Update student enrollment with group number
        await prisma.studentEnrollment.update({
          where: {
            classId_studentId: {
              classId,
              studentId: student.id
            }
          },
          data: {
            groupNumber: i + 1, // Group number (1-based)
            groupingRationale: group.rationale || rationale
          }
        });
      }

      createdGroups.push({
        id: newGroup.id,
        name: newGroup.name,
        studentCount: group.students.length,
        rationale: newGroup.rationale
      });
    }

    // Update class with grouping information
    await prisma.class.update({
      where: { id: classId },
      data: {
        groupingRationale: rationale,
        lastGroupedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: override ? 'Manual groups applied successfully' : 'AI groups applied successfully',
      groups: createdGroups,
      rationale
    });

  } catch (error) {
    console.error('Apply Groups Error:', error);
    res.status(500).json({ 
      error: 'Failed to apply groups. Please try again.' 
    });
  }
};

/**
 * Get group analytics and performance data
 * GET /api/classes/:classId/group-analytics
 */
export const getAIGroupingData = async (req: AuthRequest, res: Response) => {
  try {
    const { groupingId } = req.params;
    const teacherId = req.user!.id;
    
    // Get AI grouping data
    const aiGrouping = await prisma.aIGrouping.findFirst({
      where: { 
        id: groupingId,
        teacherId 
      }
    });

    if (!aiGrouping) {
      return res.status(404).json({ 
        error: 'AI grouping not found' 
      });
    }

    res.json({
      success: true,
      aiGrouping: {
        id: aiGrouping.id,
        classId: aiGrouping.classId,
        status: aiGrouping.status,
        rationale: aiGrouping.rationale,
        groupingData: aiGrouping.groupingData,
        createdAt: aiGrouping.createdAt,
        appliedAt: aiGrouping.appliedAt
      }
    });
  } catch (error) {
    console.error('Error getting AI grouping data:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve AI grouping data' 
    });
  }
};

export const getAIGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user!.id;
    
    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: { 
        id: classId,
        teacherId 
      }
    });

    if (!classData) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view groups for your own classes.' 
      });
    }

    // Get AI-generated groups with members
    const groups = await prisma.group.findMany({
      where: { 
        classId,
        aiGenerated: true 
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                gender: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      groups: groups.map(group => ({
        id: group.id,
        name: group.name,
        aiGenerated: group.aiGenerated,
        rationale: group.rationale,
        createdAt: group.createdAt,
        members: group.members.map(member => ({
          id: member.student.id,
          name: member.student.name,
          email: member.student.email,
          gender: member.student.gender
        }))
      }))
    });
  } catch (error) {
    console.error('Error getting AI groups:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve AI groups' 
    });
  }
};

export const getGroupAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user!.id;
    
    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: { 
        id: classId,
        teacherId 
      }
    });

    if (!classData) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view analytics for your own classes.' 
      });
    }

    // Fetch groups with member details
    const groups = await prisma.group.findMany({
      where: { classId },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                gender: true
              }
            }
          }
        }
      }
    });

    // Calculate analytics for each group
    const groupAnalytics = await Promise.all(
      groups.map(async (group) => {
        const studentIds = group.members.map(m => m.studentId);
        
        // Get enrollment data for performance metrics
        const enrollments = await prisma.studentEnrollment.findMany({
          where: {
            classId,
            studentId: { in: studentIds }
          },
          select: {
            studentId: true,
            pretestScore: true,
            posttestScore: true,
            retentionScore: true
          }
        });

        const performanceData = enrollments.map(e => ({
          pretest: e.pretestScore || 0,
          posttest: e.posttestScore || 0,
          retention: e.retentionScore || 0,
          improvement: (e.posttestScore || 0) - (e.pretestScore || 0)
        }));

        const avgPretest = Math.round(performanceData.reduce((sum, p) => sum + p.pretest, 0) / performanceData.length);
        const avgPosttest = Math.round(performanceData.reduce((sum, p) => sum + p.posttest, 0) / performanceData.length);
        const avgRetention = Math.round(performanceData.reduce((sum, p) => sum + p.retention, 0) / performanceData.length);
        const avgImprovement = Math.round(performanceData.reduce((sum, p) => sum + p.improvement, 0) / performanceData.length);

        const genderBreakdown = {
          male: group.members.filter(m => m.student.gender === 'MALE').length,
          female: group.members.filter(m => m.student.gender === 'FEMALE').length
        };

        return {
          groupId: group.id,
          groupName: group.name,
          memberCount: group.members.length,
          genderBreakdown,
          performance: {
            avgPretest,
            avgPosttest,
            avgRetention,
            avgImprovement
          },
          aiGenerated: group.aiGenerated,
          rationale: group.rationale,
          createdAt: group.createdAt
        };
      })
    );

    // Calculate class-wide analytics
    const totalStudents = await prisma.studentEnrollment.count({ where: { classId } });
    const groupedStudents = groupAnalytics.reduce((sum, g) => sum + g.memberCount, 0);
    
    const classAnalytics = {
      totalGroups: groups.length,
      totalStudents,
      groupedStudents,
      ungroupedStudents: totalStudents - groupedStudents,
      aiGeneratedGroups: groups.filter(g => g.aiGenerated).length,
      manualGroups: groups.filter(g => !g.aiGenerated).length
    };

    res.json({
      success: true,
      classAnalytics,
      groupAnalytics
    });

  } catch (error) {
    console.error('Get Group Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve group analytics' 
    });
  }
};

/**
 * Generate manual student groups for small classes (3-7 students)
 * POST /api/classes/:classId/manual-grouping
 */
export const generateManualGroups = async (req: AuthRequest, res: Response) => {
  let classId: string;
  let teacherId: string;
  
  try {
    classId = req.params.classId;
    teacherId = req.user!.id;
    
    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: { 
        id: classId,
        teacherId 
      }
    });

    if (!classData) {
      return res.status(403).json({ 
        error: 'Access denied. You can only generate groups for your own classes.' 
      });
    }

    // Check if class has enough students for manual grouping
    const enrollmentCount = await prisma.studentEnrollment.count({
      where: { classId }
    });

    if (enrollmentCount < 3) {
      return res.status(400).json({ 
        error: 'Class must have at least 3 students for manual grouping',
        details: {
          message: `Currently only ${enrollmentCount} student(s) enrolled. At least 3 students are required to create meaningful groups with high (H), medium (M), and low (L) performers.`,
          currentCount: enrollmentCount,
          minimumRequired: 3
        }
      });
    }

    if (enrollmentCount > 7) {
      return res.status(400).json({ 
        error: 'Manual grouping is designed for classes with 3-7 students',
        details: {
          message: `Currently ${enrollmentCount} students enrolled. Manual grouping works best for small classes. Use AI grouping for larger classes.`,
          currentCount: enrollmentCount,
          maximumAllowed: 7,
          suggestion: 'Use AI grouping for classes with 8+ students'
        }
      });
    }

    // Check if all students have completed the pretest
    const studentsWithoutPretest = await prisma.studentEnrollment.findMany({
      where: { 
        classId,
        pretestScore: null
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (studentsWithoutPretest.length > 0) {
      const studentNames = studentsWithoutPretest.map(e => e.student.name).join(', ');
      return res.status(400).json({ 
        error: 'Cannot generate groups until all students complete the pretest',
        details: {
          message: `${studentsWithoutPretest.length} students have not taken the pretest`,
          students: studentsWithoutPretest.map(e => ({
            id: e.student.id,
            name: e.student.name,
            email: e.student.email
          }))
        }
      });
    }

    // Generate manual grouping with H-M-L distribution
    const groupingResult = await generateManualGrouping(classId);
    
    // Store the manual grouping result in database
    const manualGroupingRecord = await prisma.aIGrouping.create({
      data: {
        classId,
        teacherId,
        groupingData: groupingResult as any,
        rationale: groupingResult.rationale,
        algorithmVersion: groupingResult.algorithmVersion,
        status: 'PENDING',
        createdAt: new Date()
      }
    });

    res.json({
      ...groupingResult,
      groupingId: manualGroupingRecord.id,
      success: true,
      message: 'Manual grouping generated successfully. Review and apply when ready.'
    });

  } catch (error) {
    console.error('Generate Manual Groups Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('At least 3 students are required')) {
        return res.status(400).json({ 
          error: 'Insufficient students for H-M-L grouping',
          details: {
            message: error.message,
            suggestion: 'Ensure you have students representing high, medium, and low performance levels'
          }
        });
      }
      
      if (error.message.includes('pretest')) {
        return res.status(400).json({ 
          error: 'Cannot generate groups until all students complete the pretest',
          details: {
            message: error.message
          }
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to generate manual groups',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    });
  }
};