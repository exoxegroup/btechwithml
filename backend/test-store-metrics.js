const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStoreMetrics() {
  try {
    const classId = 'cmj13264a0003xiolapkknkcm';
    const groupId = '0'; // This is the group number we're using for ungrouped students
    
    // Check if the group exists in the Group table
    const groupExists = await prisma.group.findFirst({
      where: { id: groupId }
    });
    
    console.log('Group exists:', groupExists);
    
    // Try to create a performance metric
    try {
      const metric = await prisma.groupPerformanceMetric.create({
        data: {
          classId,
          groupId,
          metricType: 'GROUP_AVERAGE_SCORE',
          value: 85,
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          periodEnd: new Date(),
          metadata: {}
        }
      });
      console.log('Metric created successfully:', metric);
    } catch (error) {
      console.error('Error creating metric:', error.message);
      console.error('Full error:', error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStoreMetrics();