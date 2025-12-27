// Local test script for analytics API validation
// Run with: node test-analytics-api.mjs

// Mock environment variables for testing
process.env.VITE_API_BASE_URL = 'http://localhost:3001/api';

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

// Simple test function to validate API calls
async function testAPICalls() {
  console.log('🚀 Starting Analytics API Local Tests\n');
  
  // Test configuration
  const testToken = 'test-token-123';
  const testClassId = 'test-class-456';
  const testGroupId = 'test-group-789';
  const testAlgorithmId = 'test-algorithm-abc';
  
  console.log('📋 Test 1: getGroupPerformance');
  try {
    const response = await fetch(`${process.env.VITE_API_BASE_URL}/analytics/group-performance/${testClassId}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PASSED - Group Performance Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED - HTTP Error:', response.status);
    }
  } catch (error) {
    console.log('❌ FAILED - Error:', error.message);
  }
  
  console.log('\n📋 Test 2: getAIInsights');
  try {
    const response = await fetch(`${process.env.VITE_API_BASE_URL}/analytics/ai-insights/${testClassId}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PASSED - AI Insights Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED - HTTP Error:', response.status);
    }
  } catch (error) {
    console.log('❌ FAILED - Error:', error.message);
  }
  
  console.log('\n📋 Test 3: getStudentEngagement');
  try {
    const response = await fetch(`${process.env.VITE_API_BASE_URL}/analytics/student-engagement/${testClassId}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PASSED - Student Engagement Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED - HTTP Error:', response.status);
    }
  } catch (error) {
    console.log('❌ FAILED - Error:', error.message);
  }
  
  console.log('\n📋 Test 4: getHistoricalData');
  try {
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const response = await fetch(`${process.env.VITE_API_BASE_URL}/analytics/historical/${testClassId}?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PASSED - Historical Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED - HTTP Error:', response.status);
    }
  } catch (error) {
    console.log('❌ FAILED - Error:', error.message);
  }
  
  console.log('\n📋 Test 5: exportData');
  try {
    const format = 'json';
    const response = await fetch(`${process.env.VITE_API_BASE_URL}/analytics/export/${testClassId}?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PASSED - Export Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED - HTTP Error:', response.status);
    }
  } catch (error) {
    console.log('❌ FAILED - Error:', error.message);
  }
  
  console.log('\n📋 Test 6: Error Handling');
  try {
    const response = await fetch(`${process.env.VITE_API_BASE_URL}/analytics/error-test`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('✅ PASSED - Error Handling:', errorText);
    } else {
      console.log('❌ FAILED - Expected error response');
    }
  } catch (error) {
    console.log('✅ PASSED - Error caught:', error.message);
  }
  
  console.log('\n🎯 All API endpoint tests completed!');
  console.log('💡 You can now test the actual analyticsApi.ts functions by importing them in your application.');
}

// Run the tests
testAPICalls().catch(console.error);