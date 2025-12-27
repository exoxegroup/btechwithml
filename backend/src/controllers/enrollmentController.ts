import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * @route   POST /api/enrollments
 * @desc    Enroll student in a class using code
 * @access  Private
 */
export const enrollInClass = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can enroll' });
  }

  const { classCode } = req.body;

  if (!classCode) {
    return res.status(400).json({ message: 'Class code required' });
  }

  try {
    const classRoom = await prisma.class.findUnique({ where: { classCode: classCode } });
    if (!classRoom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const existingEnrollment = await prisma.studentEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classRoom.id,
          studentId: req.user.id
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    const enrollment = await prisma.studentEnrollment.create({
      data: {
        classId: classRoom.id,
        studentId: req.user.id
      }
    });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/enrollments/:classId
 * @desc    Get enrollments for a class (Teacher only)
 * @access  Private
 */
export const getEnrollments = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can view enrollments' });
  }

  const { classId } = req.params;

  try {
    const classRoom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRoom || classRoom.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId },
      include: { student: { select: { id: true, name: true, email: true } } }
    });

    res.status(200).json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentClasses = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can view their enrolled classes' });
  }

  try {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId: req.user.id },
      include: {
        class: {
          include: {
            teacher: true,
            enrollments: true
          }
        }
      }
    });

    const classes = enrollments.map(e => ({
      id: e.class.id,
      name: e.class.name,
      classCode: e.class.classCode,
      teacherName: e.class.teacher.name,
      studentCount: e.class.enrollments.length,
      groupNumber: e.groupNumber,
      isClassGrouped: e.class.enrollments.every(enr => enr.groupNumber !== null)
    }));

    res.status(200).json(classes);
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/enrollments/:classId/student/:studentId/scores
 * @desc    Update student enrollment scores (Teacher only)
 * @access  Private
 */
export const updateStudentScores = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can update student scores' });
  }

  const { classId, studentId } = req.params;
  const { pretestScore, posttestScore, retentionScore } = req.body;

  try {
    // Verify the teacher owns this class
    const classRoom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRoom || classRoom.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if student is enrolled
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Student not enrolled in this class' });
    }

    // Update scores
    const updatedEnrollment = await prisma.studentEnrollment.update({
      where: {
        classId_studentId: {
          classId,
          studentId
        }
      },
      data: {
        pretestScore: pretestScore !== undefined ? pretestScore : enrollment.pretestScore,
        posttestScore: posttestScore !== undefined ? posttestScore : enrollment.posttestScore,
        retentionScore: retentionScore !== undefined ? retentionScore : enrollment.retentionScore,
      },
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
    });

    res.status(200).json(updatedEnrollment);
  } catch (error) {
    console.error('Update student scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/enrollments/teacher-enroll
 * @desc    Teacher enrolls students in their class
 * @access  Private (Teacher only)
 */
export const teacherEnrollStudents = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Only teachers can enroll students' });
  }

  const { classId, studentIds } = req.body;

  if (!classId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: 'Class ID and student IDs array required' });
  }

  try {
    // Verify the teacher owns this class
    const classRoom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRoom || classRoom.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only enroll students in your own classes' });
    }

    // Verify all students exist
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT'
      }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'Some students not found or not student users' });
    }

    // Check for existing enrollments
    const existingEnrollments = await prisma.studentEnrollment.findMany({
      where: {
        classId,
        studentId: { in: studentIds }
      }
    });

    const alreadyEnrolledIds = existingEnrollments.map(e => e.studentId);
    const newStudentIds = studentIds.filter(id => !alreadyEnrolledIds.includes(id));

    if (newStudentIds.length === 0) {
      return res.status(400).json({ message: 'All students are already enrolled' });
    }

    // Create new enrollments
    const enrollments = await prisma.studentEnrollment.createMany({
      data: newStudentIds.map(studentId => ({
        classId,
        studentId,
        pretestScore: null,
        posttestScore: null,
        retentionScore: null,
        groupNumber: null,
        groupingRationale: null
      }))
    });

    res.status(201).json({
      message: `Successfully enrolled ${newStudentIds.length} students`,
      enrolledCount: newStudentIds.length,
      alreadyEnrolledCount: alreadyEnrolledIds.length,
      enrolledStudents: newStudentIds
    });

  } catch (error) {
    console.error('Teacher enroll students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};