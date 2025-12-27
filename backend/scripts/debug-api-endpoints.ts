/**
 * Debug script to check specific API endpoints
 */

const API_BASE = 'http://localhost:3001/api';

async function debugEndpoints() {
  console.log('🔍 Debugging API Endpoints');
  console.log('');

  const endpoints = [
    { method: 'POST', path: '/auth/login', description: 'Teacher/Student login' },
    { method: 'GET', path: '/classes', description: 'Get classes list' },
    { method: 'PUT', path: '/classes/test-id/quiz', description: 'Create quiz (teacher)' },
    { method: 'GET', path: '/classes/test-id/quiz', description: 'Get quiz (student)' },
    { method: 'POST', path: '/classes/test-id/quiz/submit', description: 'Submit quiz' },
    { method: 'POST', path: '/classes/test-id/retention-test/submit', description: 'Submit retention test' }
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.method} ${endpoint.path}`);
    console.log(`Description: ${endpoint.description}`);
    
    try {
      const options: any = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };

      // Add auth header for protected endpoints
      if (endpoint.path !== '/auth/login') {
        options.headers['Authorization'] = 'Bearer test-token';
      }

      // Add body for POST requests
      if (endpoint.method === 'POST') {
        if (endpoint.path.includes('login')) {
          options.body = JSON.stringify({ email: 'test@test.com', password: 'test' });
        } else if (endpoint.path.includes('submit')) {
          options.body = JSON.stringify({ quizId: 'test-quiz', answers: [0, 1, 2] });
        } else if (endpoint.path.includes('quiz') && endpoint.method === 'PUT') {
          options.body = JSON.stringify({
            title: 'Test Quiz',
            type: 'RETENTION_TEST',
            questions: [{ text: 'Q1', options: ['A', 'B'], correctAnswerIndex: 0 }]
          });
        }
      }

      const response = await fetch(`${API_BASE}${endpoint.path}`, options);
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.log('❌ Endpoint not found - check route definition');
      } else if (response.status === 401) {
        console.log('✅ Endpoint exists (requires valid authentication)');
      } else if (response.status === 500) {
        console.log('⚠️  Endpoint exists but server error (likely database)');
        const errorText = await response.text();
        if (errorText.includes('database') || errorText.includes('prisma')) {
          console.log('   → Database connection issue confirmed');
        }
      } else {
        console.log(`✅ Endpoint exists and responds (${response.status})`);
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    console.log('');
  }
}

debugEndpoints().catch(console.error);