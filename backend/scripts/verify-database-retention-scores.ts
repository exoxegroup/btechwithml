/**
 * Direct database verification of retention test scores
 */

import prisma from '../src/prisma';

async function verifyRetentionScoresInDatabase() {
  console.log('🔍 Verifying Retention Scores in Database');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Find the test student
    const student = await prisma.user.findUnique({
      where: { email: 'test.student@biolearn.com' }
    });

    if (!student) {
      console.log('❌ Test student not found');
      return;
    }

    console.log('✅ Test student found');
    console.log(`   Name: ${student.name}`);
    console.log(`   ID: ${student.id}`);

    // 2. Find the test class
    const testClass = await prisma.class.findFirst({
      where: { 
        name: 'Test Biology Class - Retention Verification'
      }
    });

    if (!testClass) {
      console.log('❌ Test class not found');
      return;
    }

    console.log('');
    console.log('✅ Test class found');
    console.log(`   Name: ${testClass.name}`);
    console.log(`   ID: ${testClass.id}`);

    // 3. Check student enrollment
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: testClass.id,
          studentId: student.id
        }
      }
    });

    if (!enrollment) {
      console.log('');
      console.log('❌ Student enrollment not found');
      return;
    }

    console.log('');
    console.log('✅ Student enrollment found');
    console.log(`   Pretest Score: ${enrollment.pretestScore}%`);
    console.log(`   Posttest Score: ${enrollment.posttestScore}%`);
    console.log(`   Retention Score: ${enrollment.retentionScore}%`);

    // 4. Check retention test quiz
    const retentionQuiz = await prisma.quiz.findFirst({
      where: {
        classId_retentionTest: testClass.id,
        title: 'Test Retention Quiz'
      }
    });

    if (!retentionQuiz) {
      console.log('');
      console.log('❌ Retention test quiz not found');
      return;
    }

    console.log('');
    console.log('✅ Retention test quiz found');
    console.log(`   Quiz ID: ${retentionQuiz.id}`);
    console.log(`   Title: ${retentionQuiz.title}`);
    console.log(`   Type: ${retentionQuiz.type}`);

    // 5. Check quiz submission
    const submission = await prisma.quizSubmission.findFirst({
      where: {
        studentId: student.id,
        quizId: retentionQuiz.id
      }
    });

    if (!submission) {
      console.log('');
      console.log('❌ Quiz submission not found');
      return;
    }

    console.log('');
    console.log('✅ Quiz submission found');
    console.log(`   Submission ID: ${submission.id}`);
    console.log(`   Score: ${submission.score}%`);
    console.log(`   Submitted at: ${submission.createdAt}`);

    // 6. Verify the retention score matches the submission
    console.log('');
    console.log('🔍 Verification Results:');
    console.log(`   Expected retention score: ${submission.score}%`);
    console.log(`   Actual retention score: ${enrollment.retentionScore}%`);
    
    if (enrollment.retentionScore === submission.score) {
      console.log('');
      console.log('🎉 PERFECT MATCH!');
      console.log('✅ The retention test score is correctly recorded in the student enrollment.');
      console.log('✅ The student dashboard will show the correct retention score.');
      console.log('✅ Phase 2.4 verification is COMPLETE!');
    } else {
      console.log('');
      console.log('⚠️  Score mismatch detected');
      console.log('❌ The retention score in enrollment does not match the quiz submission.');
    }

  } catch (error) {
    console.log('❌ Database error:', error);
  }

  console.log('');
  console.log('='.repeat(60));
}

// Run the verification
verifyRetentionScoresInDatabase().catch(console.error);