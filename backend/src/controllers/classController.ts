import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate unique code
async function generateUniqueCode(): Promise<string> {
  let code: string;
  let existing;
  do {
    code = uuidv4().slice(0, 8).toUpperCase();
    existing = await prisma.class.findUnique({ where: { classCode: code } });
  } while (existing);
  return code;
}

/**
 * @route   POST /api/classes
 * @desc    Create a new class (Teacher only)
 * @access  Private
 */
export const createClass = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can create classes' });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Class name is required' });
  }

  try {
    const classCode = await generateUniqueCode();
    const newClass = await prisma.class.create({
      data: {
        name,
        classCode,
        teacherId: req.user.id,
      },
    });
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};

/**
 * @route   GET /api/classes
 * @desc    Get teacher's classes
 * @access  Private
 */
export const getTeacherClasses = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can view their classes' });
  }

  try {
    const classes = await prisma.class.findMany({
      where: {
        OR: [
          { teacherId: req.user.id },
          { enrollments: { some: { studentId: req.user.id } } }
        ]
      },
      include: {
        enrollments: true,
      },
    });

    const classesWithStudentCount = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      classCode: cls.classCode,
      teacherId: cls.teacherId,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      studentCount: cls.enrollments.length,
    }));

    res.status(200).json(classesWithStudentCount);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/classes/:id
 * @desc    Update a class (Teacher only, own classes)
 * @access  Private
 */
export const updateClass = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can update classes' });
  }

  const { id } = req.params;
  const { name, retentionTestDelayMinutes, postTestDelayMinutes } = req.body;

  try {
    const classToUpdate = await prisma.class.findUnique({ where: { id } });
    if (!classToUpdate) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classToUpdate.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own classes' });
    }

    const updateData: { name?: string; retentionTestDelayMinutes?: number; postTestDelayMinutes?: number } = {};
    if (name !== undefined) updateData.name = name;
    if (retentionTestDelayMinutes !== undefined) updateData.retentionTestDelayMinutes = retentionTestDelayMinutes;
    if (postTestDelayMinutes !== undefined) updateData.postTestDelayMinutes = postTestDelayMinutes;

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
    });
    res.status(200).json(updatedClass);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/classes/:id
 * @desc    Delete a class (Teacher only, own classes)
 * @access  Private
 */
export const deleteClass = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can delete classes' });
  }

  const { id } = req.params;

  try {
    const classToDelete = await prisma.class.findUnique({ where: { id } });
    if (!classToDelete) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classToDelete.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own classes' });
    }

    await prisma.class.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/classes/:id
 * @desc    Get class details including materials
 * @access  Private
 */
export const getClassDetails = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const { id } = req.params;

  try {
    const classRoom = await prisma.class.findUnique({
      where: { id },
      include: {
        materials: true,
        pretest: { include: { questions: true } },
        posttest: { include: { questions: true } },
        retentionTest: { include: { questions: true } },
        enrollments: { include: { student: true } },
        teacher: true,
      },
    });

    if (!classRoom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    let authorized = false;
    if (req.user.role === 'TEACHER' && classRoom.teacherId === req.user.id) {
      authorized = true;
    } else if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.studentEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: id,
            studentId: req.user.id
          }
        },
      });
      if (enrollment) {
        authorized = true;
      }
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to view this class' });
    }

    // Get Post-test submission for student if applicable
    let posttestSubmissionDate: Date | null = null;
    if (req.user.role === 'STUDENT' && classRoom.posttest) {
      const submission = await prisma.quizSubmission.findFirst({
        where: {
          quizId: classRoom.posttest.id,
          studentId: req.user.id
        },
        orderBy: { submittedAt: 'desc' }
      });
      if (submission) {
        posttestSubmissionDate = submission.submittedAt;
      }
    }

    // Helper to sanitize quiz for student
    const sanitizeQuiz = (quiz: any, type: 'PRETEST' | 'POSTTEST' | 'RETENTION') => {
      if (!quiz) return { id: '', title: '', timeLimitMinutes: 0, questions: [] };
      
      const isStudent = req.user?.role === 'STUDENT';
      
      let availableFrom = quiz.availableFrom ? new Date(quiz.availableFrom) : null;

      // Dynamic availability logic based on settings
      if (type === 'POSTTEST') {
        if (classRoom.classEndedAt) {
           const delayMs = (classRoom.postTestDelayMinutes || 0) * 60 * 1000;
           availableFrom = new Date(classRoom.classEndedAt.getTime() + delayMs);
        } else {
           // If class hasn't ended, Post-test is not available
           // Set to a future date to lock it
           availableFrom = new Date(Date.now() + 86400000 * 365); // 1 year from now
        }
      } else if (type === 'RETENTION') {
         if (posttestSubmissionDate) {
             const delayMs = (classRoom.retentionTestDelayMinutes || 0) * 60 * 1000;
             availableFrom = new Date(posttestSubmissionDate.getTime() + delayMs);
         } else {
             // If Post-test not submitted, Retention is not available
             // Set to a future date to lock it
             availableFrom = new Date(Date.now() + 86400000 * 365); // 1 year from now
         }
      }

      const now = new Date();
      const isFuture = availableFrom && now < availableFrom;

      if (isStudent && isFuture) {
         return {
           id: quiz.id,
           title: quiz.title,
           timeLimitMinutes: quiz.timeLimitMinutes,
           availableFrom: availableFrom,
           questions: [] // Hide questions if not available yet
         };
      }
      
      // If we calculated a new availableFrom, attach it to the response
      if (availableFrom) {
          return { ...quiz, availableFrom };
      }
      
      return quiz;
    };

    const response = {
      id: classRoom.id,
      name: classRoom.name,
      classCode: classRoom.classCode,
      teacherName: classRoom.teacher.name,
      studentCount: classRoom.enrollments.length,
      status: classRoom.status,
      retentionTestDelayMinutes: classRoom.retentionTestDelayMinutes,
      postTestDelayMinutes: classRoom.postTestDelayMinutes,
      classEndedAt: classRoom.classEndedAt,
      materials: classRoom.materials,
      students: classRoom.enrollments.map(e => ({
        id: e.student.id,
        name: e.student.name,
        studentId: e.student.studentId,
        gender: e.student.gender,
        pretestStatus: e.pretestScore !== null ? 'TAKEN' : 'NOT_TAKEN',
        pretestScore: e.pretestScore,
        posttestScore: e.posttestScore,
        posttestCompletedAt: e.posttestCompletedAt,
        retentionScore: e.retentionScore,
        groupNumber: e.groupNumber,
        groupingRationale: e.groupingRationale,
      })),
      pretest: sanitizeQuiz(classRoom.pretest, 'PRETEST'),
      posttest: sanitizeQuiz(classRoom.posttest, 'POSTTEST'),
      retentionTest: sanitizeQuiz(classRoom.retentionTest, 'RETENTION'),
      posttestUsesPretestQuestions: classRoom.posttestUsesPretestQuestions,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/classes/:id/analytics
 * @desc    Get class analytics including retention scores and grouping data
 * @access  Private (Teacher only)
 */
export const getClassAnalytics = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can view class analytics' });
  }

  const { id } = req.params;

  try {
    // Verify the teacher owns this class
    const classRoom = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: true,
        enrollments: { 
          include: { 
            student: true 
          } 
        },
      },
    });

    if (!classRoom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classRoom.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only view analytics for your own classes' });
    }

    // Calculate analytics
    const totalStudents = classRoom.enrollments.length;
    const studentsWithPretest = classRoom.enrollments.filter(e => e.pretestScore !== null).length;
    const studentsWithPosttest = classRoom.enrollments.filter(e => e.posttestScore !== null).length;
    const studentsWithRetention = classRoom.enrollments.filter(e => e.retentionScore !== null).length;

    res.status(200).json({
      classId: id,
      className: classRoom.name,
      totalStudents,
      completionRates: {
        pretest: totalStudents > 0 ? (studentsWithPretest / totalStudents) * 100 : 0,
        posttest: totalStudents > 0 ? (studentsWithPosttest / totalStudents) * 100 : 0,
        retention: totalStudents > 0 ? (studentsWithRetention / totalStudents) * 100 : 0,
      }
    });
  } catch (error) {
    console.error('Get class analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};