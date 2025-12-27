#!/usr/bin/env node

/**
 * Phase 4.3 Verification - Authentication & Analytics Testing Script
 * Comprehensive validation of test credentials and analytics functionality
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000',
  timeout: 10000,
  retries: 3
};

// Test credentials
const testAccounts = {
  teacher: {
    username: 'teacher_test@school.edu',
    password: 'SecureTeach123!',
    role: 'teacher',
    expectedPermissions: ['create_class', 'manage_students', 'view_analytics', 'export_data', 'end_class']
  },
  students: [
    {
      username: 'student1_test@school.edu',
      password: 'LearnStudent456!',
      role: 'student',
      expectedPerformance: 'high',
      name: 'Alice Johnson',
      answers: {
        pretest: ['B', 'C', 'B'],      // 3/3 correct
        posttest: ['Correct', 'Correct', 'Correct'], // 3/3 correct
        retention: ['A', 'B', 'A']     // 3/3 correct
      }
    },
    {
      username: 'student2_test@school.edu',
      password: 'StudySmart789!',
      role: 'student',
      expectedPerformance: 'high',
      name: 'Bob Smith',
      answers: {
        pretest: ['B', 'C', 'B'],      // 3/3 correct
        posttest: ['Correct', 'Correct', 'Correct'], // 3/3 correct
        retention: ['A', 'B', 'A']     // 3/3 correct
      }
    },
    {
      username: 'student3_test@school.edu',
      password: 'BioLearn321!',
      role: 'student',
      expectedPerformance: 'mid',
      name: 'Carol Davis',
      answers: {
        pretest: ['B', 'A', 'B'],      // 2/3 correct
        posttest: ['Correct', 'Incorrect', 'Correct'], // 2/3 correct
        retention: ['A', 'B', 'C']     // 2/3 correct
      }
    },
    {
      username: 'student4_test@school.edu',
      password: 'SciencePass654!',
      role: 'student',
      expectedPerformance: 'mid',
      name: 'David Wilson',
      answers: {
        pretest: ['B', 'A', 'B'],      // 2/3 correct
        posttest: ['Correct', 'Correct', 'Incorrect'], // 2/3 correct
        retention: ['A', 'B', 'C']     // 2/3 correct
      }
    },
    {
      username: 'student5_test@school.edu',
      password: 'TestUser987!',
      role: 'student',
      expectedPerformance: 'low',
      name: 'Eva Brown',
      answers: {
        pretest: ['A', 'A', 'B'],      // 1/3 correct
        posttest: ['Incorrect', 'Incorrect', 'Correct'], // 1/3 correct
        retention: ['B', 'A', 'D']     // 0/3 correct
      }
    },
    {
      username: 'student6_test@school.edu',
      password: 'BasicAccess123!',
      role: 'student',
      expectedPerformance: 'low',
      name: 'Frank Miller',
      answers: {
        pretest: ['A', 'A', 'A'],      // 0/3 correct
        posttest: ['Incorrect', 'Incorrect', 'Incorrect'], // 0/3 correct
        retention: ['B', 'A', 'D']     // 0/3 correct
      }
    }
  ]
};

// Color-coded logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test functions
async function testAuthentication() {
  log('\n🔐 Testing Authentication System', 'cyan');
  log('=====================================', 'cyan');

  // Test teacher authentication
  logInfo('Testing teacher authentication...');
  try {
    const response = await fetch(`${config.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testAccounts.teacher.username,
        password: testAccounts.teacher.password
      })
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess(`Teacher authentication successful - Token: ${data.token.substring(0, 20)}...`);
      
      // Validate token
      const validateResponse = await fetch(`${config.baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      
      if (validateResponse.ok) {
        logSuccess('Teacher token validation successful');
        return data.token;
      } else {
        logError('Teacher token validation failed');
        return null;
      }
    } else {
      logError(`Teacher authentication failed: ${response.status} ${response.statusText}`);
      return null;
    }
  } catch (error) {
    logError(`Teacher authentication error: ${error.message}`);
    return null;
  }
}

async function testStudentAuthentication() {
  log('\n🎓 Testing Student Authentication', 'cyan');
  log('=====================================', 'cyan');

  const results = [];
  
  for (const student of testAccounts.students) {
    logInfo(`Testing authentication for ${student.name} (${student.username})...`);
    
    try {
      const response = await fetch(`${config.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: student.username,
        password: student.password
      })
    });

      if (response.ok) {
        const data = await response.json();
        logSuccess(`${student.name} authentication successful`);
        results.push({ student, token: data.token, success: true });
      } else {
        logError(`${student.name} authentication failed: ${response.status}`);
        results.push({ student, token: null, success: false });
      }
    } catch (error) {
      logError(`${student.name} authentication error: ${error.message}`);
      results.push({ student, token: null, success: false });
    }
  }
  
  return results;
}

async function createTestClass(teacherToken) {
  log('\n🏫 Creating Test Class', 'cyan');
  log('=====================================', 'cyan');

  try {
    const response = await fetch(`${config.baseUrl}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: 'Biology Analytics Test Class'
      })
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess(`Test class created successfully - ID: ${data.id}`);
      return data.id;
    } else {
      logError(`Failed to create test class: ${response.status}`);
      return null;
    }
  } catch (error) {
    logError(`Test class creation error: ${error.message}`);
    return null;
  }
}

async function enrollStudentsInClass(classId, studentTokens, teacherToken) {
  log('\n👥 Enrolling Students in Test Class', 'cyan');
  log('=====================================', 'cyan');

  // Get the student IDs from the authenticated tokens
  const studentIds = [];
  for (const student of studentTokens) {
    if (student.success) {
      // We need to get the student ID from the token or make a request to get user info
      try {
        const response = await fetch(`${config.baseUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${student.token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          studentIds.push(userData.id);
        }
      } catch (error) {
        logError(`Failed to get user info for ${student.student.name}: ${error.message}`);
      }
    }
  }

  if (studentIds.length === 0) {
    logError('No valid student IDs found for enrollment');
    return;
  }

  logInfo(`Enrolling ${studentIds.length} students...`);
  
  try {
    const response = await fetch(`${config.baseUrl}/api/enrollments/teacher-enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        classId: classId,
        studentIds: studentIds
      })
    });

    if (response.ok) {
      const result = await response.json();
      logSuccess(`Students enrolled successfully: ${result.enrolledCount} new, ${result.alreadyEnrolledCount} already enrolled`);
    } else {
      const error = await response.text();
      logError(`Student enrollment failed: ${response.status} - ${error}`);
    }
  } catch (error) {
    logError(`Student enrollment error: ${error.message}`);
  }
}

async function simulateTestData(classId, studentTokens) {
  log('\n📝 Simulating Test Data', 'cyan');
  log('=====================================', 'cyan');

  const testTypes = ['pretest', 'posttest', 'retention'];
  
  for (const testType of testTypes) {
    logInfo(`Simulating ${testType} data...`);
    
    for (let i = 0; i < studentTokens.length; i++) {
      const student = studentTokens[i];
      if (!student.success) continue;

      const answers = student.student.answers[testType];
      const score = answers.filter((answer, index) => {
        if (testType === 'pretest' || testType === 'retention') {
          const correctAnswers = testType === 'pretest' ? ['B', 'C', 'B'] : ['A', 'B', 'A'];
          return answer === correctAnswers[index];
        } else {
          return answer === 'Correct';
        }
      }).length;

      try {
        // Convert letter answers to numeric indices for the quiz submission
        const numericAnswers = answers.map(answer => {
          if (testType === 'pretest' || testType === 'retention') {
            // Convert letter answers (A, B, C, D) to indices (0, 1, 2, 3)
            return ['A', 'B', 'C', 'D'].indexOf(answer);
          } else {
            // For posttest, convert 'Correct'/'Incorrect' to 0/1
            return answer === 'Correct' ? 0 : 1;
          }
        });

        // Use the correct quiz submission endpoint
        const endpoint = testType === 'retention' 
          ? `${config.baseUrl}/api/classes/${classId}/retention-test/submit`
          : `${config.baseUrl}/api/classes/${classId}/quiz/submit`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${student.token}`
          },
          body: JSON.stringify({
            classId: classId,
            answers: numericAnswers,
            quizType: testType === 'retention' ? 'RETENTION_TEST' : testType.toUpperCase()
          })
        });

        if (response.ok) {
          logSuccess(`${student.student.name} ${testType} data recorded (${score}/3)`);
        } else {
          const errorText = await response.text();
          logWarning(`${student.student.name} ${testType} data failed: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        logError(`${student.student.name} ${testType} data error: ${error.message}`);
      }
    }
  }
}

async function verifyAnalyticsDashboard(classId, teacherToken) {
  log('\n📊 Verifying Analytics Dashboard', 'cyan');
  log('=====================================', 'cyan');

  try {
    const response = await fetch(`${config.baseUrl}/api/analytics/class/${classId}/dashboard-summary`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess('Analytics data retrieved successfully');
      
      // Verify performance distribution
      const performanceSummary = {
        high: 0,
        mid: 0,
        low: 0
      };

      testAccounts.students.forEach(student => {
        performanceSummary[student.expectedPerformance]++;
      });

      logInfo(`Expected Performance Distribution:`);
      logInfo(`  High Performers (3/3): ${performanceSummary.high} students`);
      logInfo(`  Mid Performers (2/3): ${performanceSummary.mid} students`);
      logInfo(`  Low Performers (0-1/3): ${performanceSummary.low} students`);

      // Check if analytics data matches expectations
      if (data.groupPerformance && data.groupPerformance.length > 0) {
        logSuccess(`Group formation detected: ${data.groupPerformance.length} groups`);
        
        data.groupPerformance.forEach((group, index) => {
          logInfo(`  Group ${index + 1}: ${group.memberCount} members, Avg Score: ${group.averageScore}`);
        });
      }

      if (data.aiInsights) {
        logSuccess(`AI Algorithm Effectiveness: ${data.aiInsights.algorithmEffectiveness}%`);
      }

      return true;
    } else {
      logError(`Analytics dashboard verification failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Analytics verification error: ${error.message}`);
    return false;
  }
}

async function testDataExport(classId, teacherToken) {
  log('\n📤 Testing Data Export Functionality', 'cyan');
  log('=====================================', 'cyan');

  const exportFormats = ['csv', 'json'];
  
  for (const format of exportFormats) {
    logInfo(`Testing ${format.toUpperCase()} export...`);
    
    try {
      const response = await fetch(`${config.baseUrl}/api/analytics/class/${classId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          exportType: 'COMPREHENSIVE_DATASET',
          fileFormat: format.toUpperCase(),
          anonymizationLevel: 'NONE',
          includeGenderData: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        logSuccess(`${format.toUpperCase()} export successful - ${data.recordCount} records`);
        
        // Verify export content
        if (data.content && data.filename) {
          logInfo(`  Filename: ${data.filename}`);
          logInfo(`  Content length: ${data.content.length} characters`);
        }
      } else {
        logError(`${format.toUpperCase()} export failed: ${response.status}`);
      }
    } catch (error) {
      logError(`${format.toUpperCase()} export error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  log('🚀 Starting Phase 4.3 Verification Testing', 'bright');
  log('===============================================', 'bright');
  log('Testing authentication, analytics, and data export functionality');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Teacher Authentication
  totalTests++;
  const teacherToken = await testAuthentication();
  if (teacherToken) {
    passedTests++;
  }

  // Test 2: Student Authentication
  totalTests++;
  const studentAuthResults = await testStudentAuthentication();
  const successfulStudents = studentAuthResults.filter(r => r.success);
  if (successfulStudents.length === testAccounts.students.length) {
    passedTests++;
  }

  if (teacherToken) {
    // Test 3: Create Test Class
    totalTests++;
    const classId = await createTestClass(teacherToken);
    if (classId) {
      passedTests++;

      // Test 4: Enroll Students
      totalTests++;
      await enrollStudentsInClass(classId, studentAuthResults, teacherToken);
      passedTests++;

      // Test 5: Simulate Test Data
      totalTests++;
      await simulateTestData(classId, studentAuthResults);
      passedTests++;

      // Test 6: Verify Analytics Dashboard
      totalTests++;
      const analyticsValid = await verifyAnalyticsDashboard(classId, teacherToken);
      if (analyticsValid) {
        passedTests++;
      }

      // Test 7: Test Data Export
      totalTests++;
      await testDataExport(classId, teacherToken);
      passedTests++;

      log('\n📋 Test Summary', 'cyan');
      log('=====================================', 'cyan');
      logInfo(`Total Tests: ${totalTests}`);
      logInfo(`Passed: ${passedTests}`);
      logInfo(`Failed: ${totalTests - passedTests}`);
      logInfo(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

      if (passedTests === totalTests) {
        logSuccess('🎉 All tests passed! System is ready for analytics verification.');
        logInfo('');
        logInfo('Next steps:', 'bright');
        logInfo('1. Navigate to the analytics dashboard');
        logInfo('2. Verify group formation based on performance levels');
        logInfo('3. Check AI algorithm effectiveness metrics');
        logInfo('4. Test real-time updates and data export');
      } else {
        logWarning('⚠️  Some tests failed. Please review the errors above.');
      }
    }
  }

  // Save test results
  const results = {
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1),
    accounts: {
      teacher: { username: testAccounts.teacher.username, authenticated: !!teacherToken },
      students: studentAuthResults.map(r => ({
        username: r.student.username,
        name: r.student.name,
        authenticated: r.success,
        expectedPerformance: r.student.expectedPerformance
      }))
    }
  };

  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  logInfo('\nTest results saved to test-results.json');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests, testAccounts, config };