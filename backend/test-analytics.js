const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalytics() {
  try {
    const classId = 'cmj13264a0003xiolapkknkcm';
    
    // Check enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: { id: true, name: true, gender: true }
        }
      }
    });
    
    console.log('Enrollments:', JSON.stringify(enrollments, null, 2));
    
    // Group by groupNumber
    const groupsMap = new Map();
    enrollments.forEach(enrollment => {
      const groupNum = enrollment.groupNumber || 0;
      if (!groupsMap.has(groupNum)) {
        groupsMap.set(groupNum, []);
      }
      groupsMap.get(groupNum).push(enrollment);
    });
    
    console.log('Groups Map:', groupsMap);
    
    // Test calculations for each group
    for (const [groupNumber, groupEnrollments] of groupsMap) {
      console.log(`\nProcessing group ${groupNumber} with ${groupEnrollments.length} students`);
      
      const pretestScores = groupEnrollments.map(e => e.pretestScore).filter(Boolean);
      const posttestScores = groupEnrollments.map(e => e.posttestScore).filter(Boolean);
      const retentionScores = groupEnrollments.map(e => e.retentionScore).filter(Boolean);
      
      console.log('Pretest scores:', pretestScores);
      console.log('Posttest scores:', posttestScores);
      console.log('Retention scores:', retentionScores);
      
      const avgPretest = pretestScores.length > 0 ? pretestScores.reduce((a, b) => a + b, 0) / pretestScores.length : 0;
      const avgPosttest = posttestScores.length > 0 ? posttestScores.reduce((a, b) => a + b, 0) / posttestScores.length : 0;
      const avgRetention = retentionScores.length > 0 ? retentionScores.reduce((a, b) => a + b, 0) / retentionScores.length : avgPosttest;
      
      console.log('Averages:', { avgPretest, avgPosttest, avgRetention });
      
      const improvementRate = avgPretest > 0 ? ((avgPosttest - avgPretest) / avgPretest) * 100 : 0;
      const retentionRate = avgPosttest > 0 ? (avgRetention / avgPosttest) * 100 : 100;
      
      console.log('Rates:', { improvementRate, retentionRate });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics();