import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateStudentIds() {
  console.log('Starting Student ID migration...');

  try {
    // Find all students without a studentId
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentId: null
      }
    });

    console.log(`Found ${students.length} students needing IDs.`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const student of students) {
      // Generate a unique ID
      // Format: STU + current timestamp (base36) + random chars to ensure uniqueness
      // Max 20 chars.
      // STU (3) + Timestamp (~8) + Random (4) = ~15 chars
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const studentId = `STU${timestamp}${random}`;

      try {
        await prisma.user.update({
          where: { id: student.id },
          data: { studentId }
        });
        updatedCount++;
        console.log(`Updated user ${student.email} with ID: ${studentId}`);
      } catch (err: any) {
        console.error(`Failed to update user ${student.email}:`, err.message);
        errors.push(`${student.email}: ${err.message}`);
      }
    }

    console.log('Migration completed.');
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Error details:', errors);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateStudentIds();
