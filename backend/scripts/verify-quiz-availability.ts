
// @ts-ignore
import { PrismaClient } from '@prisma/client';
// @ts-ignore
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

async function verifyQuizAvailability() {
  console.log('🔍 Verifying Quiz Availability Logic');
  console.log('====================================');

  try {
    // 1. Setup: Ensure we have a teacher and a student
    const teacherEmail = 'test.teacher.avail@biolearn.com';
    const teacherPassword = 'password123';
    const studentEmail = 'test.student.avail@biolearn.com';
    const studentPassword = 'password123';

    // Create Teacher if not exists
    let teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
    if (!teacher) {
      // @ts-ignore
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(teacherPassword, 10);
      teacher = await prisma.user.create({
        data: {
          email: teacherEmail,
          password: hashedPassword,
          name: 'Test Teacher',
          gender: 'MALE',
          role: 'TEACHER'
        }
      });
      console.log('✅ Created test teacher');
    }

    // Create Student if not exists
    let student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student) {
      // @ts-ignore
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(studentPassword, 10);
      student = await prisma.user.create({
        data: {
          email: studentEmail,
          password: hashedPassword,
          name: 'Test Student',
          gender: 'FEMALE',
          role: 'STUDENT'
        }
      });
      console.log('✅ Created test student');
    }

    // Login Teacher
    const teacherLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password: teacherPassword })
    });
    const teacherData = await teacherLoginRes.json();
    const teacherToken = teacherData.token;
    console.log('✅ Teacher logged in');

    // Login Student
    const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: studentPassword })
    });
    const studentData = await studentLoginRes.json();
    const studentToken = studentData.token;
    console.log('✅ Student logged in');

    // Create a Class
    const classRes = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: 'Availability Test Class',
        subject: 'Biology',
        description: 'Testing quiz availability'
      })
    });
    const newClass = await classRes.json();
    const classId = newClass.id;
    console.log(`✅ Created class: ${classId}`);

    // Enroll Student
    await prisma.studentEnrollment.create({
      data: {
        studentId: student!.id,
        classId: classId
      }
    }).catch(() => {}); // Ignore if already enrolled
    console.log('✅ Enrolled student');

    // 2. Test Case 1: Future Availability (Should be hidden)
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24); // Tomorrow

    const quizRes = await fetch(`${API_BASE}/classes/${classId}/quiz`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'Future Post Test',
        timeLimitMinutes: 30,
        quizType: 'POSTTEST',
        availableFrom: futureDate.toISOString(),
        questions: [
          {
            text: 'What is the powerhouse of the cell?',
            options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'],
            correctAnswerIndex: 0
          }
        ]
      })
    });
    const quiz = await quizRes.json();
    console.log(`✅ Created/Updated quiz with availableFrom: ${futureDate.toISOString()}`);

    // Fetch as Student
    const studentClassRes = await fetch(`${API_BASE}/classes/${classId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentClassData = await studentClassRes.json();
    
    // In Class model, relations are named posttest, pretest, retentionTest
    const postTest = studentClassData.posttest;
    
    if (postTest) {
      if ((!postTest.questions || postTest.questions.length === 0) && postTest.availableFrom) {
        console.log('✅ SUCCESS: Questions are hidden for future quiz');
        console.log(`   availableFrom is present: ${postTest.availableFrom}`);
      } else {
        console.error('❌ FAILURE: Questions are visible or availableFrom missing for future quiz');
        console.log('   Questions length:', postTest.questions ? postTest.questions.length : 'undefined');
      }
    } else {
        console.log('❌ FAILURE: Posttest not found in class details');
    }

    // 3. Test Case 2: Past Availability (Should be visible)
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 24); // Yesterday

    await fetch(`${API_BASE}/classes/${classId}/quiz`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'Past Post Test',
        timeLimitMinutes: 30,
        quizType: 'POSTTEST',
        availableFrom: pastDate.toISOString(),
        questions: [
            {
              text: 'What is the powerhouse of the cell?',
              options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'],
              correctAnswerIndex: 0
            }
          ]
      })
    });
    console.log(`✅ Updated quiz with availableFrom: ${pastDate.toISOString()}`);

    // Fetch as Student Again
    const studentClassRes2 = await fetch(`${API_BASE}/classes/${classId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentClassData2 = await studentClassRes2.json();
    const postTest2 = studentClassData2.posttest;

    if (postTest2) {
      if (postTest2.questions && postTest2.questions.length > 0) {
        console.log('✅ SUCCESS: Questions are visible for past quiz');
      } else {
        console.error('❌ FAILURE: Questions are still hidden for past quiz');
      }
    }

    // Cleanup
    await prisma.studentEnrollment.deleteMany({ where: { classId: classId } });
    // Use deleteMany with OR for quiz
    await prisma.quiz.deleteMany({ 
        where: { 
            OR: [
                { classId_posttest: classId },
                { classId_pretest: classId },
                { classId_retentionTest: classId }
            ]
        } 
    });
    await prisma.class.delete({ where: { id: classId } });
    await prisma.user.deleteMany({ where: { email: { in: [teacherEmail, studentEmail] } } });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyQuizAvailability();
