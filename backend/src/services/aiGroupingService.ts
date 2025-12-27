import { PrismaClient } from '@prisma/client';
import { ollamaService } from '../utils/ollama';

const prisma = new PrismaClient();

export interface StudentPerformance {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  pretestScore: number;
  posttestScore: number;
  retentionScore?: number;
  overallPerformance: number; // Average of all scores
}

export interface AIStudentGroup {
  id: string;
  name: string;
  students: StudentPerformance[];
  studentIds: string[]; // For frontend compatibility
  genderBalance: {
    male: number;
    female: number;
    ratio: number; // 0.5 = perfect balance
  };
  performanceMetrics: {
    averageScore: number;
    scoreRange: { min: number; max: number };
    abilityDistribution: { high: number; medium: number; low: number };
  };
}

export interface AIGroupingResult {
  groups: AIStudentGroup[];
  rationale: string;
  algorithmVersion: string;
  timestamp: Date;
  totalStudents: number;
  genderBalance: {
    overallRatio: number;
    balancedGroups: number;
    totalGroups: number;
  };
  performanceBalance: {
    averageGroupScore: number;
    scoreStandardDeviation: number;
  };
}

export interface GroupingConstraints {
  minGroupSize: number;
  maxGroupSize: number;
  targetGenderBalance: number; // 0.5 = perfect balance
  performanceCategories: {
    high: { min: number; max: number };
    medium: { min: number; max: number };
    low: { min: number; max: number };
  };
}

export const DEFAULT_CONSTRAINTS: GroupingConstraints = {
  minGroupSize: 4,
  maxGroupSize: 6,
  targetGenderBalance: 0.5,
  performanceCategories: {
    high: { min: 80, max: 100 },
    medium: { min: 60, max: 79 },
    low: { min: 0, max: 59 }
  }
};

/**
 * Calculates overall performance score for a student based on pretest, posttest, and retention scores
 */
function calculateOverallPerformance(
  pretestScore: number,
  posttestScore: number,
  retentionScore?: number | null
): number {
  if (retentionScore !== undefined && retentionScore !== null) {
    return Math.round((pretestScore + posttestScore + retentionScore) / 3);
  }
  return Math.round((pretestScore + posttestScore) / 2);
}

/**
 * Categorizes student performance into high/medium/low based on score ranges
 */
function categorizePerformance(score: number, constraints: GroupingConstraints): 'high' | 'medium' | 'low' {
  const { performanceCategories } = constraints;
  
  if (score >= performanceCategories.high.min) return 'high';
  if (score >= performanceCategories.medium.min) return 'medium';
  return 'low';
}

/**
 * Analyzes gender balance in a group
 */
function analyzeGenderBalance(students: StudentPerformance[]): AIStudentGroup['genderBalance'] {
  const male = students.filter(s => s.gender === 'MALE').length;
  const female = students.filter(s => s.gender === 'FEMALE').length;
  const total = students.length;
  
  return {
    male,
    female,
    ratio: total > 0 ? Math.abs(male - female) / total : 0
  };
}

/**
 * Analyzes performance metrics for a group
 */
function analyzePerformanceMetrics(students: StudentPerformance[], constraints: GroupingConstraints): AIStudentGroup['performanceMetrics'] {
  const scores = students.map(s => s.overallPerformance);
  const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  
  const abilityDistribution = {
    high: students.filter(s => categorizePerformance(s.overallPerformance, constraints) === 'high').length,
    medium: students.filter(s => categorizePerformance(s.overallPerformance, constraints) === 'medium').length,
    low: students.filter(s => categorizePerformance(s.overallPerformance, constraints) === 'low').length
  };
  
  return {
    averageScore,
    scoreRange: { min, max },
    abilityDistribution
  };
}

/**
 * Generates AI-powered student grouping with gender balance and mixed-ability optimization
 */
export async function generateAIGrouping(
  classId: string,
  constraints: GroupingConstraints = DEFAULT_CONSTRAINTS
): Promise<AIGroupingResult> {
  try {
    // Fetch all enrolled students with their performance data
    const enrollments = await prisma.studentEnrollment.findMany({
    where: { classId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          gender: true
        }
      }
    }
  });

    if (enrollments.length === 0) {
      throw new Error('No students enrolled in this class');
    }

    // Transform enrollment data into performance metrics
    const students: StudentPerformance[] = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: enrollment.student.name,
      gender: enrollment.student.gender,
      pretestScore: enrollment.pretestScore || 0,
      posttestScore: enrollment.posttestScore || 0,
      retentionScore: enrollment.retentionScore || undefined,
      overallPerformance: calculateOverallPerformance(
        enrollment.pretestScore || 0,
        enrollment.posttestScore || 0,
        enrollment.retentionScore
      )
    }));

    // Generate AI grouping using Ollama
    const groupingPrompt = createGroupingPrompt(students, constraints);
    
    const aiResponse = await ollamaService.generateJson(groupingPrompt, {
        num_predict: 4000, // Increase token limit for large grouping responses
        temperature: 0.2 // Lower temperature for more deterministic/structured output
    });

    if (!aiResponse || !aiResponse.groups) {
      throw new Error('Invalid or empty response from AI');
    }
    
    // Transform AI response into our structured format
    const groups: AIStudentGroup[] = aiResponse.groups.map((group: any) => {
      const groupStudents = group.studentIds.map((studentId: string) => 
        students.find(s => s.id === studentId)!
      ).filter((s: StudentPerformance | undefined) => s !== undefined); // Filter out undefined if AI hallucinated an ID
      
      return {
        id: group.groupId,
        name: group.groupName,
        students: groupStudents,
        studentIds: group.studentIds, // Add studentIds for frontend compatibility
        genderBalance: analyzeGenderBalance(groupStudents),
        performanceMetrics: analyzePerformanceMetrics(groupStudents, constraints)
      };
    });

    // Calculate overall metrics
    const totalStudents = students.length;
    const totalGroups = groups.length;
    const balancedGroups = groups.filter(g => g.genderBalance.ratio <= 0.3).length; // Within 30% of perfect balance
    
    const overallScores = groups.map(g => g.performanceMetrics.averageScore);
    const averageGroupScore = overallScores.length > 0 ? Math.round(overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length) : 0;
    const scoreVariance = overallScores.length > 0 ? overallScores.reduce((sum, score) => sum + Math.pow(score - averageGroupScore, 2), 0) / overallScores.length : 0;
    const scoreStandardDeviation = Math.round(Math.sqrt(scoreVariance));

    return {
      groups,
      rationale: aiResponse.overallRationale || 'AI generated grouping based on performance and gender balance.',
      algorithmVersion: '1.0.0-ollama',
      timestamp: new Date(),
      totalStudents,
      genderBalance: {
        overallRatio: totalStudents > 0 ? Math.abs(students.filter(s => s.gender === 'MALE').length - students.filter(s => s.gender === 'FEMALE').length) / totalStudents : 0,
        balancedGroups,
        totalGroups
      },
      performanceBalance: {
        averageGroupScore,
        scoreStandardDeviation
      }
    };

  } catch (error) {
    console.error('AI Grouping Error:', error);
    throw new Error('Failed to generate AI grouping: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Fallback grouping algorithm when AI service is unavailable
 * Uses simple heuristics to create balanced groups
 */
export async function generateFallbackGrouping(classId: string, targetGroupCount?: number): Promise<AIGroupingResult> {
  // Fetch students for this class
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { classId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          gender: true
        }
      }
    }
  });

  if (enrollments.length === 0) {
    throw new Error('No students enrolled in this class');
  }

  // Check if all students have completed the pretest
  const studentsWithoutPretest = enrollments.filter(e => e.pretestScore === null);
  if (studentsWithoutPretest.length > 0) {
    const studentNames = studentsWithoutPretest.map(e => e.student.name).join(', ');
    throw new Error(`Cannot generate groups until all students complete the pretest. ${studentsWithoutPretest.length} students have not taken the pretest: ${studentNames}`);
  }

  // Transform enrollment data into performance metrics
  const students: StudentPerformance[] = enrollments.map(enrollment => ({
    id: enrollment.student.id,
    name: enrollment.student.name,
    gender: enrollment.student.gender,
    pretestScore: enrollment.pretestScore || 0,
    posttestScore: enrollment.posttestScore || 0,
    retentionScore: enrollment.retentionScore || undefined,
    overallPerformance: calculateOverallPerformance(
      enrollment.pretestScore || 0,
      enrollment.posttestScore || 0,
      enrollment.retentionScore
    )
  }));

  // Sort students by performance and gender for balanced distribution
  const sortedStudents = [...students].sort((a, b) => {
    // Sort by performance first (high to low)
    const performanceDiff = b.overallPerformance - a.overallPerformance;
    if (performanceDiff !== 0) return performanceDiff;
    
    // Then by gender for better balance
    return a.gender.localeCompare(b.gender);
  });

  // Create groups using round-robin distribution
  // Default to 4 students per group if no count specified
  // If targetGroupCount is provided, use it.
  const numGroups = targetGroupCount && targetGroupCount > 0 
    ? targetGroupCount 
    : Math.ceil(students.length / 4);
    
  console.log(`Fallback Grouping: Students=${students.length}, TargetGroups=${targetGroupCount}, CalculatedGroups=${numGroups}`);

  const groups: AIStudentGroup[] = [];
  
  for (let i = 0; i < numGroups; i++) {
    const groupStudents: StudentPerformance[] = [];
    
    // Distribute students using round-robin pattern
    for (let j = i; j < sortedStudents.length; j += numGroups) {
      groupStudents.push(sortedStudents[j]);
    }
    
    groups.push({
      id: `fallback_group_${i + 1}`,
      name: `Team ${String.fromCharCode(65 + i)}`, // Team A, B, C, etc.
      students: groupStudents,
      studentIds: groupStudents.map(s => s.id), // Add studentIds for frontend compatibility
      genderBalance: analyzeGenderBalance(groupStudents),
      performanceMetrics: analyzePerformanceMetrics(groupStudents, {
         minGroupSize: 3,
         maxGroupSize: 5,
         targetGenderBalance: 0.5,
         performanceCategories: {
           high: { min: 80, max: 100 },
           medium: { min: 60, max: 79 },
           low: { min: 0, max: 59 }
         }
       })
    });
  }

  // Calculate overall metrics from actual groups
  const totalStudents = students.length;
  const totalGroups = groups.length;
  const balancedGroups = groups.filter(g => g.genderBalance.ratio <= 0.3).length;
  
  const overallScores = groups.map(g => g.performanceMetrics.averageScore);
  const averageGroupScore = Math.round(overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length);
  const scoreVariance = overallScores.reduce((sum, score) => sum + Math.pow(score - averageGroupScore, 2), 0) / overallScores.length;
  const scoreStandardDeviation = Math.round(Math.sqrt(scoreVariance));

  return {
    groups,
    rationale: 'Fallback grouping: Balanced distribution of gender and performance levels across groups using heuristic algorithm.',
    algorithmVersion: '1.0.0-fallback',
    timestamp: new Date(),
    totalStudents,
    genderBalance: {
      overallRatio: Math.abs(students.filter(s => s.gender === 'MALE').length - students.filter(s => s.gender === 'FEMALE').length) / totalStudents,
      balancedGroups,
      totalGroups
    },
    performanceBalance: {
      averageGroupScore,
      scoreStandardDeviation
    }
  };
}

/**
 * Creates the prompt for Gemini AI to generate optimal student grouping
 */
function createGroupingPrompt(students: StudentPerformance[], constraints: GroupingConstraints): string {
  const studentList = students.map(student => 
    `ID: ${student.id}, Name: ${student.name}, Gender: ${student.gender}, ` +
    `Pretest: ${student.pretestScore}, Posttest: ${student.posttestScore}, ` +
    `Retention: ${student.retentionScore || 'N/A'}, Overall: ${student.overallPerformance}`
  ).join('\n');

  return `You are an expert educational AI assistant specializing in creating optimal student groupings for collaborative learning.

STUDENT DATA:
${studentList}

GROUPING REQUIREMENTS:
- Group size: ${constraints.minGroupSize}-${constraints.maxGroupSize} students per group
- Gender balance: Aim for equal representation (50% male, 50% female) in each group
- Performance balance: Distribute high, medium, and low performing students evenly across groups
- Performance categories: High (80-100), Medium (60-79), Low (0-59) based on overall scores

OBJECTIVE:
Create collaborative learning groups that maximize educational effectiveness by:
1. Ensuring gender-balanced discussions and perspectives
2. Mixing ability levels so stronger students can help others
3. Creating groups of optimal size for collaboration
4. Providing clear rationale for each grouping decision

OUTPUT FORMAT:
Return a JSON object with:
{
  "groups": [
    {
      "groupId": "group_1",
      "groupName": "Team Alpha",
      "studentIds": ["student_id_1", "student_id_2", ...],
      "rationale": "This group combines... [explain gender and performance balance]"
    }
  ],
  "overallRationale": "Overall grouping strategy explanation...",
  "genderBalanceAnalysis": "Gender distribution analysis across all groups...",
  "performanceBalanceAnalysis": "Performance distribution analysis..."
}

IMPORTANT:
- Use all students provided
- Balance gender representation as closely as possible
- Distribute performance levels evenly
- Provide specific, educational rationale for decisions
- Ensure no group is too homogeneous in gender or performance`;
}

/**
 * Manual grouping algorithm for small classes (3-7 students)
 * Follows specific H-M-L distribution rules for optimal mentoring
 */
export async function generateManualGrouping(classId: string): Promise<AIGroupingResult> {
  // Fetch students for this class
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { classId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          gender: true
        }
      }
    }
  });

  if (enrollments.length === 0) {
    throw new Error('No students enrolled in this class');
  }

  if (enrollments.length < 3) {
    throw new Error('At least 3 students are required for grouping with H-M-L distribution');
  }

  // Check if all students have completed the pretest
  const studentsWithoutPretest = enrollments.filter(e => e.pretestScore === null);
  if (studentsWithoutPretest.length > 0) {
    const studentNames = studentsWithoutPretest.map(e => e.student.name).join(', ');
    throw new Error(`Cannot generate groups until all students complete the pretest. ${studentsWithoutPretest.length} students have not taken the pretest: ${studentNames}`);
  }

  // Transform enrollment data into performance metrics
  const students: StudentPerformance[] = enrollments.map(enrollment => ({
    id: enrollment.student.id,
    name: enrollment.student.name,
    gender: enrollment.student.gender,
    pretestScore: enrollment.pretestScore || 0,
    posttestScore: enrollment.posttestScore || 0,
    retentionScore: enrollment.retentionScore || undefined,
    overallPerformance: calculateOverallPerformance(
      enrollment.pretestScore || 0,
      enrollment.posttestScore || 0,
      enrollment.retentionScore
    )
  }));

  // Categorize students by performance
  const constraints = DEFAULT_CONSTRAINTS;
  const highPerformers = students.filter(s => categorizePerformance(s.overallPerformance, constraints) === 'high');
  const mediumPerformers = students.filter(s => categorizePerformance(s.overallPerformance, constraints) === 'medium');
  const lowPerformers = students.filter(s => categorizePerformance(s.overallPerformance, constraints) === 'low');

  const totalStudents = students.length;
  let groups: AIStudentGroup[] = [];
  let rationale = '';

  // Apply specific grouping rules based on class size
  if (totalStudents === 3) {
    // Single group: 1H, 1M, 1L
    groups = [{
      id: 'manual_group_1',
      name: 'Team Alpha',
      students: students,
      studentIds: students.map(s => s.id),
      genderBalance: analyzeGenderBalance(students),
      performanceMetrics: analyzePerformanceMetrics(students, constraints)
    }];
    rationale = 'Single group with balanced H-M-L distribution for optimal mentoring dynamics.';
  } else if (totalStudents === 4) {
    // Group 1: 1H, 1M | Group 2: 1M, 1L
    const group1 = [highPerformers[0], mediumPerformers[0]];
    const group2 = [mediumPerformers[1] || highPerformers[1] || students[3], lowPerformers[0]];
    
    groups = [
      {
        id: 'manual_group_1',
        name: 'Team Alpha',
        students: group1,
        studentIds: group1.map(s => s.id),
        genderBalance: analyzeGenderBalance(group1),
        performanceMetrics: analyzePerformanceMetrics(group1, constraints)
      },
      {
        id: 'manual_group_2',
        name: 'Team Beta',
        students: group2,
        studentIds: group2.map(s => s.id),
        genderBalance: analyzeGenderBalance(group2),
        performanceMetrics: analyzePerformanceMetrics(group2, constraints)
      }
    ];
    rationale = 'Two groups with H-M and M-L distribution for peer mentoring and balanced dynamics.';
  } else if (totalStudents === 5) {
    // Group 1 (3-person): 1H, 1M, 1L | Group 2 (2-person): 1M, 1L
    const group1 = [highPerformers[0], mediumPerformers[0], lowPerformers[0]];
    const group2 = [mediumPerformers[1] || students[4], lowPerformers[1] || students[4]];
    
    groups = [
      {
        id: 'manual_group_1',
        name: 'Team Alpha',
        students: group1,
        studentIds: group1.map(s => s.id),
        genderBalance: analyzeGenderBalance(group1),
        performanceMetrics: analyzePerformanceMetrics(group1, constraints)
      },
      {
        id: 'manual_group_2',
        name: 'Team Beta',
        students: group2,
        studentIds: group2.map(s => s.id),
        genderBalance: analyzeGenderBalance(group2),
        performanceMetrics: analyzePerformanceMetrics(group2, constraints)
      }
    ];
    rationale = 'One 3-person group (H-M-L) and one 2-person group (M-L) for strong mentoring setups.';
  } else if (totalStudents === 6) {
    // Two groups: each 1H, 1M, 1L
    const group1 = [highPerformers[0], mediumPerformers[0], lowPerformers[0]];
    const group2 = [highPerformers[1] || mediumPerformers[2], mediumPerformers[1], lowPerformers[1]];
    
    groups = [
      {
        id: 'manual_group_1',
        name: 'Team Alpha',
        students: group1,
        studentIds: group1.map(s => s.id),
        genderBalance: analyzeGenderBalance(group1),
        performanceMetrics: analyzePerformanceMetrics(group1, constraints)
      },
      {
        id: 'manual_group_2',
        name: 'Team Beta',
        students: group2,
        studentIds: group2.map(s => s.id),
        genderBalance: analyzeGenderBalance(group2),
        performanceMetrics: analyzePerformanceMetrics(group2, constraints)
      }
    ];
    rationale = 'Two balanced groups each with H-M-L distribution for optimal peer learning.';
  } else if (totalStudents === 7) {
    // Group 1 (3-person): 1H, 1M, 1L | Group 2 (4-person): 1H, 2M, 1L
    const group1 = [highPerformers[0], mediumPerformers[0], lowPerformers[0]];
    const group2 = [
      highPerformers[1] || mediumPerformers[2], 
      mediumPerformers[1], 
      mediumPerformers[2] || students[6], 
      lowPerformers[1]
    ];
    
    groups = [
      {
        id: 'manual_group_1',
        name: 'Team Alpha',
        students: group1,
        studentIds: group1.map(s => s.id),
        genderBalance: analyzeGenderBalance(group1),
        performanceMetrics: analyzePerformanceMetrics(group1, constraints)
      },
      {
        id: 'manual_group_2',
        name: 'Team Beta',
        students: group2,
        studentIds: group2.map(s => s.id),
        genderBalance: analyzeGenderBalance(group2),
        performanceMetrics: analyzePerformanceMetrics(group2, constraints)
      }
    ];
    rationale = 'One 3-person group (H-M-L) and one 4-person group (H-2M-L) for balanced mentoring dynamics.';
  }

  // Calculate overall metrics
  const totalGroups = groups.length;
  const balancedGroups = groups.filter(g => g.genderBalance.ratio <= 0.3).length;
  
  const overallScores = groups.map(g => g.performanceMetrics.averageScore);
  const averageGroupScore = Math.round(overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length);
  const scoreVariance = overallScores.reduce((sum, score) => sum + Math.pow(score - averageGroupScore, 2), 0) / overallScores.length;
  const scoreStandardDeviation = Math.round(Math.sqrt(scoreVariance));

  return {
    groups,
    rationale,
    algorithmVersion: '1.0.0-manual',
    timestamp: new Date(),
    totalStudents,
    genderBalance: {
      overallRatio: Math.abs(students.filter(s => s.gender === 'MALE').length - students.filter(s => s.gender === 'FEMALE').length) / totalStudents,
      balancedGroups,
      totalGroups
    },
    performanceBalance: {
      averageGroupScore,
      scoreStandardDeviation
    }
  };
}

export function validateGrouping(result: AIGroupingResult, constraints: GroupingConstraints): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check group sizes
  result.groups.forEach(group => {
    if (group.students.length < constraints.minGroupSize) {
      issues.push(`Group ${group.name} has only ${group.students.length} students (minimum: ${constraints.minGroupSize})`);
    }
    if (group.students.length > constraints.maxGroupSize) {
      issues.push(`Group ${group.name} has ${group.students.length} students (maximum: ${constraints.maxGroupSize})`);
    }
  });

  // Check gender balance
  const poorlyBalancedGroups = result.groups.filter(g => g.genderBalance.ratio > 0.4);
  if (poorlyBalancedGroups.length > 0) {
    issues.push(`${poorlyBalancedGroups.length} groups have poor gender balance (>40% difference)`);
  }

  // Check performance distribution
  const totalHigh = result.groups.reduce((sum, g) => sum + g.performanceMetrics.abilityDistribution.high, 0);
  const totalMedium = result.groups.reduce((sum, g) => sum + g.performanceMetrics.abilityDistribution.medium, 0);
  const totalLow = result.groups.reduce((sum, g) => sum + g.performanceMetrics.abilityDistribution.low, 0);

  if (totalHigh === 0) issues.push('No high-performing students distributed across groups');
  if (totalMedium === 0) issues.push('No medium-performing students distributed across groups');
  if (totalLow === 0) issues.push('No low-performing students distributed across groups');

  return {
    valid: issues.length === 0,
    issues
  };
}
