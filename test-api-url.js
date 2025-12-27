// Test script to verify API URL configuration
const axios = require('axios');

async function testApiUrl() {
  console.log('🧪 Testing API URL configuration...\n');
  
  try {
    // Test the API URL from the frontend
    console.log('1️⃣ Testing frontend API URL (should be port 3001)...');
    const frontendResponse = await axios.get('http://localhost:5173/src/services/api.ts');
    console.log('Frontend API file accessible');
    
    // Test backend health on port 3001
    console.log('\n2️⃣ Testing backend health on port 3001...');
    const backendResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Backend is healthy:', backendResponse.data);
    
    // Test analytics endpoint
    console.log('\n3️⃣ Testing analytics endpoint...');
    const analyticsResponse = await axios.get('http://localhost:3001/api/analytics/class/cmj6aol7d0002t91qezlzjrhu/performance-data?chartType=line', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWo2YW52bmQwMDAwdDkxcXJhdzdub3BhIiwiZW1haWwiOiJuQGdtYWlsLmNvbSIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNzM1NDc1NDE4LCJleHAiOjE3MzU1NjE4MTh9.8a8dWvPpqE8hCPaDpQp8y2o8Xl2cXl2cXl2cXl2cXl2c'
      }
    });
    
    console.log('✅ Analytics endpoint working');
    console.log('Chart data length:', analyticsResponse.data.data?.chartData?.length || 0);
    
    if (analyticsResponse.data.data?.chartData?.length > 0) {
      const chartData = analyticsResponse.data.data.chartData;
      console.log('First group memberCount:', chartData[0].memberCount);
      console.log('All memberCounts:', chartData.map(g => g.memberCount));
      
      const totalStudents = chartData.reduce((sum, group) => sum + (group.memberCount || 0), 0);
      console.log('📊 Total students calculated:', totalStudents);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testApiUrl();