#!/usr/bin/env node

/**
 * Create test users for authentication validation
 */

const config = {
  baseUrl: 'http://localhost:3001',
  timeout: 10000
};

// Test users to create
const testUsers = [
  {
    name: 'Test Teacher',
    email: 'teacher_test@school.edu',
    password: 'SecureTeach123!',
    role: 'TEACHER',
    gender: 'OTHER'
  },
  {
    name: 'Alice Johnson',
    email: 'student1_test@school.edu',
    password: 'LearnStudent456!',
    role: 'STUDENT',
    gender: 'FEMALE'
  },
  {
    name: 'Bob Smith',
    email: 'student2_test@school.edu',
    password: 'StudySmart789!',
    role: 'STUDENT',
    gender: 'MALE'
  },
  {
    name: 'Carol Davis',
    email: 'student3_test@school.edu',
    password: 'BioLearn321!',
    role: 'STUDENT',
    gender: 'FEMALE'
  },
  {
    name: 'David Wilson',
    email: 'student4_test@school.edu',
    password: 'SciencePass654!',
    role: 'STUDENT',
    gender: 'MALE'
  },
  {
    name: 'Eva Brown',
    email: 'student5_test@school.edu',
    password: 'TestUser987!',
    role: 'STUDENT',
    gender: 'FEMALE'
  },
  {
    name: 'Frank Miller',
    email: 'student6_test@school.edu',
    password: 'BasicAccess123!',
    role: 'STUDENT',
    gender: 'MALE'
  }
];

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function createUser(userData) {
  try {
    const response = await fetch(`${config.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess(`${userData.name} created successfully`);
      return { success: true, token: data.token, user: data.user };
    } else if (response.status === 409) {
      logInfo(`${userData.name} already exists (skipping)`);
      return { success: true, exists: true };
    } else {
      const error = await response.text();
      logError(`${userData.name} creation failed: ${response.status} - ${error}`);
      return { success: false, error: error };
    }
  } catch (error) {
    logError(`${userData.name} creation error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createAllUsers() {
  log('🚀 Creating Test Users', 'cyan');
  log('=====================================', 'cyan');

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of testUsers) {
    logInfo(`Creating ${user.name} (${user.email})...`);
    const result = await createUser(user);
    
    if (result.success) {
      if (result.exists) {
        skipped++;
      } else {
        created++;
      }
    } else {
      failed++;
    }
  }

  log('\n📋 Summary', 'cyan');
  log('=====================================', 'cyan');
  logInfo(`Total users: ${testUsers.length}`);
  logSuccess(`Created: ${created}`);
  logInfo(`Skipped (already exist): ${skipped}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }

  if (failed === 0) {
    logSuccess('🎉 All test users ready! You can now run the authentication validation script.');
    logInfo('');
    logInfo('Next step: node test-authentication-validation.js');
  } else {
    logWarning('⚠️  Some users failed to create. Please check the errors above.');
  }
}

// Run if executed directly
if (require.main === module) {
  createAllUsers().catch(error => {
    logError(`Script execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { createAllUsers, testUsers };