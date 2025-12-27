import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testRetentionWorkflow() {
  try {
    console.log('🧪 Starting Phase 2.4 Verification - Retention Test Workflow');
    
    // 1. Check if we have existing users
    const existingUsers = await prisma.user.findMany();
    console.log(`📊 Found ${existingUsers.length} existing users`);
    
    if (existingUsers.length === 0) {
      console.log('📝 Creating test users...');
      
      // Create a teacher
      const teacher = await prisma.user.create({
        data: {
          email: 'test.teacher@biolearn.com',
          name: 'Test Teacher',
          password: await bcrypt.hash('password123', 10),
          role: 'TEACHER',
          gender: 'OTHER',
        },
      });
      console.log(`👨‍🏫 Created teacher: ${teacher.name} (${teacher.email})`);
      
      // Create a student
      const student = await prisma.user.create({
        data: {
          email: 'test.student@biolearn.com',
          name: 'Test Student',
          password: await bcrypt.hash('password123', 10),
          role: 'STUDENT',
          gender: 'FEMALE',
        },
      });
      console.log(`👩‍🎓 Created student: ${student.name} (${student.email})`);
      
      // Create a class
      const newClass = await prisma.class.create({
        data: {
          name: 'Test Biology Class - Retention Verification',
          classCode: 'BIO-TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          teacherId: teacher.id,
          status: 'ACTIVE',
        },
      });
      console.log(`📚 Created class: ${newClass.name}`);
      
      // Enroll the student
      const enrollment = await prisma.studentEnrollment.create({
        data: {
          classId: newClass.id,
          studentId: student.id,
          pretestScore: 75,
          posttestScore: 85,
        },
      });
      console.log(`✅ Enrolled student with pretest: ${enrollment.pretestScore}, posttest: ${enrollment.posttestScore}`);
      
      // Create a pretest quiz
      const pretestQuiz = await prisma.quiz.create({
        data: {
          title: 'Biology Pretest',
          type: 'PRETEST',
          timeLimitMinutes: 30,
          pretestForClass: {
            connect: { id: newClass.id }
          },
          questions: {
            create: [
              {
                text: 'What is photosynthesis?',
                options: ['Food making process', 'Breathing', 'Sleeping', 'Growing'],
                correctAnswerIndex: 0,
              },
              {
                text: 'What is the basic unit of life?',
                options: ['Organ', 'Cell', 'Tissue', 'System'],
                correctAnswerIndex: 1,
              },
            ],
          },
        },
      });
      console.log(`📝 Created pretest quiz: ${pretestQuiz.title}`);
      
      // Create a posttest quiz
      const posttestQuiz = await prisma.quiz.create({
        data: {
          title: 'Biology Posttest',
          type: 'POSTTEST',
          timeLimitMinutes: 30,
          posttestForClass: {
            connect: { id: newClass.id }
          },
          questions: {
            create: [
              {
                text: 'What is photosynthesis?',
                options: ['Food making process', 'Breathing', 'Sleeping', 'Growing'],
                correctAnswerIndex: 0,
              },
              {
                text: 'What is the basic unit of life?',
                options: ['Organ', 'Cell', 'Tissue', 'System'],
                correctAnswerIndex: 1,
              },
            ],
          },
        },
      });
      console.log(`📝 Created posttest quiz: ${posttestQuiz.title}`);
      
      console.log('\n✅ Test setup complete!');
      console.log('🎯 Ready for retention test verification:');
      console.log(`   - Teacher login: test.teacher@biolearn.com / password123`);
      console.log(`   - Student login: test.student@biolearn.com / password123`);
      console.log(`   - Class ID: ${newClass.id}`);
      console.log(`   - Student has completed pretest (75%) and posttest (85%)`);
      
    } else {
      console.log('✅ Existing users found, skipping setup');
    }
    
    // Check for existing retention tests
    const retentionTests = await prisma.quiz.findMany({
      where: { type: 'RETENTION_TEST' },
      include: { retentionTestForClass: true },
    });
    
    console.log(`\n📊 Found ${retentionTests.length} existing retention tests`);
    retentionTests.forEach(test => {
      console.log(`   - "${test.title}" in class: ${test.retentionTestForClass?.name || 'Unknown'}`);
    });
    
    // 3. Check student enrollments with retention scores
    const enrollmentsWithRetention = await prisma.studentEnrollment.findMany({
      where: { retentionScore: { not: null } },
      include: {
        student: true,
        class: true,
      },
    });
    
    console.log(`\n📊 Found ${enrollmentsWithRetention.length} students with retention scores`);
    enrollmentsWithRetention.forEach(enrollment => {
      console.log(`   - ${enrollment.student.name}: ${enrollment.retentionScore}% in ${enrollment.class.name}`);
    });
    
    console.log('\n🎯 Phase 2.4 Verification Ready!');
    console.log('Next steps:');
    console.log('1. Login as teacher and create a retention test');
    console.log('2. Login as student and take the retention test');
    console.log('3. Verify retention score appears in student dashboard');
    
  } catch (error) {
    console.error('❌ Error during verification setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRetentionWorkflow();