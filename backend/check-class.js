const { PrismaClient } = require('@prisma/client');

// Create Prisma client with proper configuration
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkClass() {
  const classId = 'cmj6aol7d0002t91qezlzjrhu';
  
  // Check if class exists
  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    include: {
      teacher: true,
      enrollments: {
        include: {
          student: true
        }
      }
    }
  });
  
  if (!classroom) {
    console.log('Class not found');
    return;
  }
  
  console.log('Class found:');
  console.log('- ID:', classroom.id);
  console.log('- Name:', classroom.name);
  console.log('- Teacher:', classroom.teacher.name);
  console.log('- Total enrollments:', classroom.enrollments.length);
  
  // Check students without pretest
  const studentsWithoutPretest = classroom.enrollments.filter(e => 
    e.pretestScore === null || e.pretestScore === 0
  );
  
  console.log('- Students without pretest:', studentsWithoutPretest.length);
  
  if (studentsWithoutPretest.length > 0) {
    console.log('Students without pretest:');
    studentsWithoutPretest.forEach(e => {
      console.log('  - ' + e.student.name + ' (ID: ' + e.student.id + ')');
    });
  }
  
  // Check minimum student requirement
  const meetsMinimumStudents = classroom.enrollments.length >= 8;
  console.log('- Meets minimum 8 students:', meetsMinimumStudents);
  
  // Check if all students have completed pretest
  const allCompletedPretest = studentsWithoutPretest.length === 0;
  console.log('- All students completed pretest:', allCompletedPretest);
  
  console.log('\nValidation summary:');
  console.log('- Can generate AI groups:', meetsMinimumStudents && allCompletedPretest);
  
  if (!meetsMinimumStudents) {
    console.log('ERROR: Class needs at least 8 students');
  }
  
  if (!allCompletedPretest) {
    console.log('ERROR: All students must complete pretest');
  }
}

checkClass().catch(console.error).finally(() => prisma.$disconnect());