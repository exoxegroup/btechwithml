
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLASS_ID = 'cmkeew2t50002qzlt4tn9pn9g';

async function resetSubmissions() {
  console.log('🧹 Resetting submissions for class:', CLASS_ID);
  
  try {
    // 1. Find all quizzes for this class
    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { classId_pretest: CLASS_ID },
          { classId_posttest: CLASS_ID },
          { classId_retentionTest: CLASS_ID }
        ]
      }
    });

    const quizIds = quizzes.map(q => q.id);
    console.log(`Found ${quizIds.length} quizzes.`);

    if (quizIds.length > 0) {
      // 2. Delete submissions
      const deleteResult = await prisma.quizSubmission.deleteMany({
        where: {
          quizId: { in: quizIds }
        }
      });
      console.log(`✅ Deleted ${deleteResult.count} quiz submissions.`);
    }

    // 3. Reset enrollment scores
    const updateResult = await prisma.studentEnrollment.updateMany({
      where: { classId: CLASS_ID },
      data: {
        pretestScore: null,
        posttestScore: null,
        retentionScore: null
      }
    });
    console.log(`✅ Reset scores for ${updateResult.count} enrollments.`);

  } catch (error) {
    console.error('❌ Error resetting submissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSubmissions();
