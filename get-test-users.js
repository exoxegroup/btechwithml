const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTestUsers() {
  try {
    const teacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' },
      select: { email: true, name: true }
    });
    
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      select: { email: true, name: true }
    });
    
    console.log('=== TEST CREDENTIALS ===');
    console.log('TEACHER:');
    console.log('Email:', teacher?.email || 'No teacher found');
    console.log('Name:', teacher?.name || 'N/A');
    console.log('Password: password123');
    console.log('');
    console.log('STUDENT:');
    console.log('Email:', student?.email || 'No student found');
    console.log('Name:', student?.name || 'N/A');
    console.log('Password: password123');
    console.log('========================');
    
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTestUsers();