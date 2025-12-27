import { AuthRequest } from '../middleware/authMiddleware';
import { Request, Response } from 'express';
import prisma from '../prisma';

// Create or update a quiz
export const updateQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { title, timeLimitMinutes, questions, quizType, availableFrom } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the teacher owns this class
    const classExists = await prisma.class.findFirst({
      where: { id: classId, teacherId }
    });

    if (!classExists) {
      return res.status(404).json({ error: 'Class not found or unauthorized' });
    }

    // Validate quiz type
    if (!['PRETEST', 'POSTTEST', 'RETENTION_TEST'].includes(quizType)) {
      return res.status(400).json({ error: 'Invalid quiz type' });
    }

    // Validate questions
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    for (const question of questions) {
      if (!question.text || !question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return res.status(400).json({ error: 'Each question must have text and at least 2 options' });
      }
      if (typeof question.correctAnswerIndex !== 'number' || question.correctAnswerIndex < 0 || question.correctAnswerIndex >= question.options.length) {
        return res.status(400).json({ error: 'Invalid correct answer index' });
      }
    }

    // Check if quiz already exists for this class and type
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        ...(quizType === 'PRETEST' 
          ? { classId_pretest: classId }
          : quizType === 'POSTTEST'
          ? { classId_posttest: classId }
          : { classId_retentionTest: classId }
        )
      }
    });

    let quiz;

    if (existingQuiz) {
      // Update existing quiz
      quiz = await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: {
          title,
          timeLimitMinutes,
          availableFrom,
          questions: {
            deleteMany: {}, // Delete all existing questions
            create: questions.map((q: any) => ({
              text: q.text,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex
            }))
          }
        },
        include: {
          questions: true
        }
      });
    } else {
      // Create new quiz
      quiz = await prisma.quiz.create({
        data: {
          title,
          timeLimitMinutes,
          type: quizType,
          availableFrom,
          questions: {
            create: questions.map((q: any) => ({
              text: q.text,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex
            }))
          },
          ...(quizType === 'PRETEST'
            ? { classId_pretest: classId }
            : quizType === 'POSTTEST'
            ? { classId_posttest: classId }
            : { classId_retentionTest: classId }
          )
        },
        include: {
          questions: true
        }
      });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quiz for a class
export const getQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { type } = req.query;

    if (!type || !['PRETEST', 'POSTTEST', 'RETENTION_TEST'].includes(type as string)) {
      return res.status(400).json({ error: 'Valid quiz type is required' });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        ...(type === 'PRETEST'
          ? { classId_pretest: classId }
          : type === 'POSTTEST'
          ? { classId_posttest: classId }
          : { classId_retentionTest: classId }
        )
      },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            // Don't include correctAnswerIndex for student access
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quiz with answers (for teachers)
export const getQuizWithAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { type } = req.query;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the teacher owns this class
    const classExists = await prisma.class.findFirst({
      where: { id: classId, teacherId }
    });

    if (!classExists) {
      return res.status(404).json({ error: 'Class not found or unauthorized' });
    }

    if (!type || !['PRETEST', 'POSTTEST', 'RETENTION_TEST'].includes(type as string)) {
      return res.status(400).json({ error: 'Valid quiz type is required' });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        ...(type === 'PRETEST'
          ? { classId_pretest: classId }
          : type === 'POSTTEST'
          ? { classId_posttest: classId }
          : { classId_retentionTest: classId }
        )
      },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz with answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete quiz
export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { type } = req.query;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the teacher owns this class
    const classExists = await prisma.class.findFirst({
      where: { id: classId, teacherId }
    });

    if (!classExists) {
      return res.status(404).json({ error: 'Class not found or unauthorized' });
    }

    if (!type || !['PRETEST', 'POSTTEST', 'RETENTION_TEST'].includes(type as string)) {
      return res.status(400).json({ error: 'Valid quiz type is required' });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        ...(type === 'PRETEST'
          ? { classId_pretest: classId }
          : type === 'POSTTEST'
          ? { classId_posttest: classId }
          : { classId_retentionTest: classId }
        )
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await prisma.quiz.delete({
      where: { id: quiz.id }
    });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitPretest = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can submit pretests' });
  }

  const { classId, answers } = req.body; // answers: array of selected indices

  try {
    const classRoom = await prisma.class.findUnique({
      where: { id: classId },
      include: { pretest: { include: { questions: true } } },
    });

    if (!classRoom || !classRoom.pretest) {
      return res.status(404).json({ message: 'Pretest not found for this class' });
    }

    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { classId_studentId: { classId, studentId: req.user.id } },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this class' });
    }

    if (enrollment.pretestScore !== null) {
      return res.status(400).json({ message: 'Pretest already taken' });
    }

    const questions = classRoom.pretest.questions;
    let score = 0;
    answers.forEach((answer: number, index: number) => {
      if (answer === questions[index].correctAnswerIndex) {
        score += 1;
      }
    });
    const finalScore = (score / questions.length) * 100;

    await prisma.studentEnrollment.update({
      where: { id: enrollment.id },
      data: { pretestScore: finalScore },
    });

    res.status(200).json({ message: 'Pretest submitted successfully', score: finalScore });
  } catch (error) {
    console.error('Submit pretest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit quiz (both pretest and posttest)
export const submitQuiz = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can submit quizzes' });
  }

  const { classId, answers, quizType } = req.body; // answers: array of selected indices

  if (!quizType || !['PRETEST', 'POSTTEST', 'RETENTION_TEST'].includes(quizType)) {
    return res.status(400).json({ message: 'Valid quiz type is required' });
  }

  try {
    // Find the quiz
    const quiz = await prisma.quiz.findFirst({
      where: {
        ...(quizType === 'PRETEST'
          ? { classId_pretest: classId }
          : quizType === 'POSTTEST'
          ? { classId_posttest: classId }
          : { classId_retentionTest: classId }
        )
      },
      include: { questions: true }
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found for this class' });
    }

    // Check availability
    if (quiz.availableFrom && new Date() < new Date(quiz.availableFrom)) {
      return res.status(403).json({ 
        message: 'This quiz is not yet available.', 
        availableFrom: quiz.availableFrom 
      });
    }

    // Verify student is enrolled
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { classId_studentId: { classId, studentId: req.user.id } },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this class' });
    }

    // Check if already taken
    const existingSubmission = await prisma.quizSubmission.findFirst({
      where: {
        studentId: req.user.id,
        quizId: quiz.id
      }
    });

    if (existingSubmission) {
      return res.status(200).json({ 
        message: 'Quiz already taken', 
        score: existingSubmission.score,
        existing: true
      });
    }

    // Calculate score
    const questions = quiz.questions;
    
    // Validate answers length matches questions length (or at least handle mismatches safely)
    if (answers.length !== questions.length) {
       // Log warning but proceed, or return error? 
       // For now, let's just proceed but ensure we don't crash.
       // Ideally, we should enforce answering all questions or pad with incorrects.
    }

    let score = 0;
    answers.forEach((answer: number, index: number) => {
      if (index < questions.length && answer === questions[index].correctAnswerIndex) {
        score += 1;
      }
    });
    const finalScore = (score / questions.length) * 100;

    // Create submission record
    try {
      await prisma.quizSubmission.create({
        data: {
          studentId: req.user.id,
          quizId: quiz.id,
          score: finalScore,
          submittedAt: new Date()
        }
      });
    } catch (error: any) {
      // Handle unique constraint violation (race condition where submission was created between check and create)
      if (error.code === 'P2002') {
        console.log('Race condition detected: Quiz submission already exists');
        return res.status(200).json({ 
          message: 'Quiz already taken', 
          score: finalScore, // Note: We return the score calculated here, but ideally should fetch existing.
                             // However, for UX continuity, this is acceptable as the user just "submitted" it.
                             // Or we can just return success message.
          existing: true
        });
      }
      throw error;
    }

    // Update enrollment with score
    const updateData = quizType === 'PRETEST' 
      ? { pretestScore: finalScore }
      : quizType === 'POSTTEST'
      ? { posttestScore: finalScore }
      : { retentionScore: finalScore };

    await prisma.studentEnrollment.update({
      where: { id: enrollment.id },
      data: updateData,
    });

    res.status(200).json({ 
      message: `${quizType.toLowerCase()} submitted successfully`, 
      score: finalScore,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit retention test (wrapper around submitQuiz for clarity)
export const submitRetentionTest = async (req: AuthRequest, res: Response) => {
  // Reuse the existing submitQuiz logic with RETENTION_TEST type
  req.body.quizType = 'RETENTION_TEST';
  req.body.classId = req.params.classId; // Add classId from URL parameters
  return submitQuiz(req, res);
};