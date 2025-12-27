// Local test script for analytics API validation
// Run with: node test-analytics-api.js

import * as analyticsApi from './src/services/analyticsApi.js';

// Mock environment variables for testing
process.env.VITE_API_BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testToken = 'test-token-123';
const testClassId = 'test-class-456';
const testGroupId = 'test-group-789';
const testAlgorithmId = 'test-algorithm-abc';

// Mock fetch for local testing
const originalFetch = global.fetch;

global.fetch = async (url, options) => {
  console.log(`📡 API Call: ${url}`);
  console.log(`🔧 Method: ${options?.method || 'GET'}`);
  console.log(`📋 Headers:`, options?.headers);
  if (options?.body) {
    console.log(`📦 Body:`, options.body);
  }

  // Simulate different API endpoints
  if (url.includes('/analytics/group-performance/')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        {
          groupId: '1',
          groupName: 'Group A',
          memberCount: 5,
          averageScore: 85,
          aiGenerated: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          groupId: '2',
          groupName: 'Group B',
          memberCount: 4,
          averageScore: 78,
          aiGenerated: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]
    };
  }

  if (url.includes('/analytics/ai-insights/')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        {
          algorithmId: 'algo1',
          algorithmName: 'Content Recommendation',
          effectiveness: 0.85,
          usageCount: 150,
          averageScore: 82,
          lastUsed: '2024-01-15T10:30:00Z'
        },
        {
          algorithmId: 'algo2',
          algorithmName: 'Adaptive Learning',
          effectiveness: 0.92,
          usageCount: 200,
          averageScore: 88,
          lastUsed: '2024-01-15T14:20:00Z'
        }
      ]
    };
  }

  if (url.includes('/analytics/student-engagement/')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        {
          studentId: 'student1',
          name: 'Alice Johnson',
          engagementScore: 0.88,
          loginCount: 45,
          lastActive: '2024-01-15T16:30:00Z',
          assignmentsCompleted: 12,
          averageScore: 85
        },
        {
          studentId: 'student2',
          name: 'Bob Smith',
          engagementScore: 0.75,
          loginCount: 38,
          lastActive: '2024-01-15T15:45:00Z',
          assignmentsCompleted: 10,
          averageScore: 78
        }
      ]
    };
  }

  if (url.includes('/analytics/historical/')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        {
          date: '2024-01-01',
          totalStudents: 25,
          averageScore: 82,
          engagementRate: 0.85,
          assignmentsCompleted: 150
        },
        {
          date: '2024-01-02',
          totalStudents: 27,
          averageScore: 84,
          engagementRate: 0.87,
          assignmentsCompleted: 165
        }
      ]
    };
  }

  if (url.includes('/analytics/export/')) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 
        'content-type': 'application/json',
        'Content-Disposition': 'attachment; filename="analytics-export.json"'
      }),
      json: async () => ({
        exportId: 'export-123',
        filename: 'analytics-export.json',
        format: 'json',
        recordCount: 150,
        generatedAt: '2024-01-15T17:00:00Z'
      })
    };
  }

  // Simulate error responses
  if (url.includes('/error-test')) {
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Resource not found',
      json: async () => ({ message: 'Resource not found' })
    };
  }

  // Default response for unknown endpoints
  return {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    text: async () => 'Endpoint not found',
    json: async () => ({ message: 'Endpoint not found' })
  };
};

// Test runner
async function runTests() {
  console.log('🚀 Starting Analytics API Local Tests\n');
  
  const tests = [
    {
      name: 'getGroupPerformance',
      func: () => analyticsApi.getGroupPerformance(testClassId, testToken)
    },
    {
      name: 'getAIInsights (alias for getAIAlgorithmInsights)',
      func: () => analyticsApi.getAIInsights(testClassId, testToken)
    },
    {
      name: 'getAIAlgorithmInsights',
      func: () => analyticsApi.getAIAlgorithmInsights(testClassId, testToken)
    },
    {
      name: 'getStudentEngagement',
      func: () => analyticsApi.getStudentEngagement(testClassId, testToken)
    },
    {
      name: 'getHistoricalData',
      func: () => analyticsApi.getHistoricalData(testClassId, '2024-01-01', '2024-01-31', testToken)
    },
    {
      name: 'exportData',
      func: () => analyticsApi.exportData(testClassId, 'json', testToken)
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      const result = await test.func();
      console.log(`✅ PASSED - Response:`, JSON.stringify(result, null, 2));
      passed++;
    } catch (error) {
      console.log(`❌ FAILED - Error:`, error.message);
      failed++;
    }
  }

  // Test error handling
  console.log(`\n📋 Testing: Error Handling`);
  try {
    // Temporarily modify fetch to return error
    global.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Database connection failed',
      json: async () => ({ message: 'Database connection failed' })
    });
    
    await analyticsApi.getGroupPerformance(testClassId, testToken);
    console.log(`❌ FAILED - Expected error was not thrown`);
    failed++;
  } catch (error) {
    console.log(`✅ PASSED - Error handling works:`, error.message);
    passed++;
  }

  // Restore original fetch
  global.fetch = originalFetch;

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
}

// Run the tests
runTests().catch(console.error);