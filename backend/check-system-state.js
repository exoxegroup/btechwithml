
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkState() {
  console.log('🔍 System State Report');
  console.log('=====================');

  // Users
  const userCount = await prisma.user.count();
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' }, take: 5 });
  console.log(`\n👥 Users: ${userCount}`);
  console.log('Recent Teachers:', teachers.map(t => t.email).join(', '));

  // Classes
  const classCount = await prisma.class.count();
  const classes = await prisma.class.findMany({ 
    include: { _count: { select: { enrollments: true } } } 
  });
  console.log(`\n🏫 Classes: ${classCount}`);
  classes.forEach(c => {
    console.log(`  - ${c.name} (${c.id}): ${c._count.enrollments} enrolled students`);
  });

  // Students (Users with enrolled classes)
  const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
  console.log(`\n🎓 Total Student Users: ${studentCount}`);

  // Submissions (Activity)
  const submissionCount = await prisma.quizSubmission.count();
  console.log(`\n📝 Quiz Submissions: ${submissionCount}`);
  
  // Analytics/Export
  const exportCount = await prisma.researchDataExport.count();
  console.log(`\n📊 Research Exports: ${exportCount}`);
  const recentExports = await prisma.researchDataExport.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
  recentExports.forEach(e => {
    console.log(`  - [${e.status}] ${e.exportType} (${e.fileFormat}) - ${e.createdAt.toISOString()}`);
  });

  // Groups
  const groupCount = await prisma.group.count();
  console.log(`\n🧩 Student Groups: ${groupCount}`);

  console.log('\n=====================');
}

checkState()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
