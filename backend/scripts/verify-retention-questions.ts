
// @ts-ignore
import { PrismaClient } from '@prisma/client';
// @ts-ignore
const fetch = require('node-fetch');
// @ts-ignore
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

async function verifyRetentionQuestions() {
  console.log('🔍 Verifying Retention Test Questions in API Response');
  console.log('==================================================');

  try {
    // 1. Find a class with retention test
    const classWithRetention = await prisma.class.findFirst({
      where: {
        retentionTest: { isNot: null }
      },
      include: {
        retentionTest: true,
        teacher: true
      }
    });

    if (!classWithRetention) {
      console.log('❌ No class with retention test found in DB.');
      return;
    }

    console.log(`✅ Found Class: ${classWithRetention.name} (${classWithRetention.id})`);

    // 2. Find a student
    const enrollment = await prisma.studentEnrollment.findFirst({
        where: { classId: classWithRetention.id },
        include: { student: true }
    });

    if (!enrollment) {
        console.log('❌ No student enrolled in this class.');
        return;
    }

    console.log(`   Student: ${enrollment.student.email}`);

    // 3. Reset student password to 'password123'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    await prisma.user.update({
        where: { id: enrollment.student.id },
        data: { password: hashedPassword }
    });
    console.log('✅ Reset student password to "password123"');

    // 4. Login as student
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: enrollment.student.email,
            password: 'password123'
        })
    });

    if (!loginResponse.ok) {
        console.log('❌ Failed to login as student.');
        return;
    }

    const { token } = await loginResponse.json();
    console.log('✅ Logged in as student');

    // 5. Call getClassDetails
    const classResponse = await fetch(`${API_BASE}/classes/${classWithRetention.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!classResponse.ok) {
        console.log(`❌ Failed to get class details: ${classResponse.status}`);
        return;
    }

    const classData = await classResponse.json();
    
    // 6. Verify retentionTest structure
    if (classData.retentionTest) {
        console.log('✅ retentionTest object present in response');
        if (classData.retentionTest.questions) {
            console.log(`✅ questions array present: ${classData.retentionTest.questions.length} questions`);
            if (classData.retentionTest.questions.length > 0) {
                 console.log('SAMPLE QUESTION:', classData.retentionTest.questions[0]);
            }
        } else {
            console.log('❌ questions array MISSING in retentionTest object!');
        }
    } else {
        console.log('❌ retentionTest object MISSING in response!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRetentionQuestions();
