const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLASS_ID = 'cmkeew2t50002qzlt4tn9pn9g';
const STUDENT_EMAILS = [
  'student1_test@school.edu',
  'student2_test@school.edu',
  'student3_test@school.edu',
  'student4_test@school.edu',
  'student5_test@school.edu',
  'student6_test@school.edu'
];

async function enrollStudents() {
  try {
    console.log(`Enrolling students in class ${CLASS_ID}...`);
    for (const email of STUDENT_EMAILS) {
      const student = await prisma.user.findUnique({ where: { email } });
      if (student) {
        // Check if already enrolled
        const existing = await prisma.studentEnrollment.findUnique({
          where: {
            classId_studentId: {
              classId: CLASS_ID,
              studentId: student.id
            }
          }
        });

        if (!existing) {
          await prisma.studentEnrollment.create({
            data: {
              classId: CLASS_ID,
              studentId: student.id
            }
          });
          console.log(`✅ Enrolled ${student.name}`);
        } else {
          console.log(`ℹ️  ${student.name} already enrolled`);
        }
      } else {
        console.log(`❌ Student not found: ${email}`);
      }
    }
  } catch (error) {
    console.error('Error enrolling students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enrollStudents();
