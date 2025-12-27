// Script to set pretest scores for testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setPretestScores() {
  try {
    const classId = 'cmj314hid0002msc5qhjbxss9';
    
    // Get all student enrollments for this class
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId },
      include: { student: true }
    });

    console.log(`Found ${enrollments.length} enrollments`);

    // Set random pretest scores between 40-95 for each student
    for (let i = 0; i < enrollments.length; i++) {
      const enrollment = enrollments[i];
      const score = Math.floor(Math.random() * 55) + 40; // Random score 40-95
      
      await prisma.studentEnrollment.update({
        where: { id: enrollment.id },
        data: { pretestScore: score }
      });
      
      console.log(`Set pretest score ${score} for ${enrollment.student.name}`);
    }

    console.log('All pretest scores set successfully!');
  } catch (error) {
    console.error('Error setting pretest scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setPretestScores();