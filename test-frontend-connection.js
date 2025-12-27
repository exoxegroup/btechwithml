// Test frontend API connection
const axios = require('axios');

async function testFrontendConnection() {
  console.log('🧪 Testing frontend API connection...\n');
  
  try {
    // Test if frontend is accessible
    console.log('1️⃣ Testing frontend server...');
    const frontendResponse = await axios.get('http://localhost:5173');
    console.log('✅ Frontend is accessible');
    
    // Test CORS by making a request to backend through frontend
    console.log('\n2️⃣ Testing CORS to backend...');
    
    // Simulate what the frontend would do
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWo2YW52bmQwMDAwdDkxcXJhdzdub3BhIiwiZW1haWwiOiJuQGdtYWlsLmNvbSIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNzM1NDc1NDE4LCJleHAiOjE3MzU1NjE4MTh9.8a8dWvPpqE8hCPaDpQp8y2o8Xl2cXl2cXl2cXl2cXl2c';
    
    // Test the analytics endpoint directly
    console.log('\n3️⃣ Testing analytics endpoint directly...');
    const analyticsResponse = await axios.get('http://localhost:3001/api/analytics/class/cmj6aol7d0002t91qezlzjrhu/performance-data?chartType=line', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Analytics endpoint response:');
    console.log('Status:', analyticsResponse.status);
    console.log('Chart data length:', analyticsResponse.data.data?.chartData?.length);
    
    if (analyticsResponse.data.data?.chartData?.length > 0) {
      const firstGroup = analyticsResponse.data.data.chartData[0];
      console.log('First group memberCount:', firstGroup.memberCount);
      console.log('First group complete data:', JSON.stringify(firstGroup, null, 2));
    }
    
    // Calculate total students
    const totalStudents = analyticsResponse.data.data.chartData.reduce((sum, group) => sum + (group.memberCount || 0), 0);
    console.log('\n📊 Total students calculated:', totalStudents);
    
  } catch (error) {
 console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendConnection();