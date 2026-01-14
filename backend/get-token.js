const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getToken() {
  try {
    // Find the test teacher user
    const user = await prisma.user.findFirst({
      where: { email: 'teacher_test@school.edu' }
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      '2be4efe819471b3fcc2c715a21f2985a6cd4a3c14dda4c87d1a81162c027abe3c782021ffa9e9880c1aac5b715c466b820c0ad1f414df51f6610a1ced492a4d2',
      { expiresIn: '7d' }
    );

    console.log(token);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getToken();