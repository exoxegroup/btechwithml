const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLASS_ID = 'cmkeew2t50002qzlt4tn9pn9g';

const STUDENTS = [
  { email: 'student1_test@school.edu', type: 'HIGH' },  // Alice
  { email: 'student2_test@school.edu', type: 'HIGH' },  // Bob
  { email: 'student3_test@school.edu', type: 'HIGH' },  // Carol
  { email: 'student4_test@school.edu', type: 'MID' },   // David
  { email: 'student5_test@school.edu', type: 'MID' },   // Eva
  { email: 'student6_test@school.edu', type: 'LOW' }    // Frank
];

async function seedAnalyticsData() {
  try {
    console.log(`🌱 Seeding analytics data for class ${CLASS_ID}...`);

    // 1. Update Student Scores
    for (const s of STUDENTS) {
      const user = await prisma.user.findUnique({ where: { email: s.email } });
      if (!user) {
        console.log(`❌ User not found: ${s.email}`);
        continue;
      }

      const enrollment = await prisma.studentEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: CLASS_ID,
            studentId: user.id
          }
        }
      });

      if (enrollment) {
        let scores = {};
        if (s.type === 'HIGH') {
          scores = { pretestScore: 100, posttestScore: 100, retentionScore: 100 };
        } else if (s.type === 'MID') {
          scores = { pretestScore: 66.6, posttestScore: 70, retentionScore: 75 };
        } else {
          scores = { pretestScore: 33.3, posttestScore: 40, retentionScore: 30 };
        }

        await prisma.studentEnrollment.update({
          where: { id: enrollment.id },
          data: scores
        });
        console.log(`✅ Updated scores for ${user.name} (${s.type})`);
      }
    }

    // 2. Create Groups
    let group1, group2, group3;
    const existingGroups = await prisma.group.findMany({ where: { classId: CLASS_ID } });
    
    if (existingGroups.length > 0) {
      console.log('ℹ️  Groups already exist, using existing groups.');
      // Ideally check names, but for now just take first 3 or create if needed.
      // We assume if groups exist, they are the ones we want or we can reuse them.
      // But for consistent assignment, let's delete them and recreate to be safe?
      // No, deletion might cascade. Let's just use them if names match, or create if not.
      
      // Simpler: Delete all group members for this class first to avoid unique constraints or duplicates
      // Then recreate assignments.
      // But we need the group IDs.
      
      // Let's just create new groups if they don't exist by name.
      group1 = existingGroups.find(g => g.name === 'Alpha Team (High)');
      group2 = existingGroups.find(g => g.name === 'Beta Team (Mid)');
      group3 = existingGroups.find(g => g.name === 'Gamma Team (Mixed)');
    }

    if (!group1) {
       group1 = await prisma.group.create({ data: { name: 'Alpha Team (High)', classId: CLASS_ID } });
       console.log('✅ Created Alpha Team');
    }
    if (!group2) {
       group2 = await prisma.group.create({ data: { name: 'Beta Team (Mid)', classId: CLASS_ID } });
       console.log('✅ Created Beta Team');
    }
    if (!group3) {
       group3 = await prisma.group.create({ data: { name: 'Gamma Team (Mixed)', classId: CLASS_ID } });
       console.log('✅ Created Gamma Team');
    }

    // 3. Assign Students to Groups
    // Fetch users again to get IDs
    const users = await Promise.all(STUDENTS.map(s => prisma.user.findUnique({ where: { email: s.email } })));
    
    // Clear existing assignments for these groups to avoid duplicates
    const groupIds = [group1.id, group2.id, group3.id];
    await prisma.groupMember.deleteMany({
      where: {
        groupId: { in: groupIds }
      }
    });

    // Group 1: Alice, Bob (High)
    await prisma.groupMember.createMany({
      data: [
        { groupId: group1.id, studentId: users[0].id },
        { groupId: group1.id, studentId: users[1].id }
      ]
    });

    // Group 2: Carol (High), David (Mid)
    await prisma.groupMember.createMany({
      data: [
        { groupId: group2.id, studentId: users[2].id },
        { groupId: group2.id, studentId: users[3].id }
      ]
    });

    // Group 3: Eva (Mid), Frank (Low)
    await prisma.groupMember.createMany({
      data: [
        { groupId: group3.id, studentId: users[4].id },
        { groupId: group3.id, studentId: users[5].id }
      ]
    });

    console.log('✅ Assigned students to groups');

  } catch (error) {
    console.error('Error seeding analytics data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAnalyticsData();
