// Test with fresh token
const axios = require('axios');

async function testWithFreshToken() {
  console.log('🧪 Testing with fresh token...\n');
  
  try {
    // 1. Login to get fresh token
    console.log('1️⃣ Logging in to get fresh token...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'n@gmail.com',
      password: 'Hamdala456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received:', token.substring(0, 30) + '...');
    
    // 2. Test analytics endpoint with fresh token
    console.log('\n2️⃣ Testing analytics endpoint with fresh token...');
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
      const chartData = analyticsResponse.data.data.chartData;
      console.log('\n📊 Chart Data Summary:');
      chartData.forEach((group, index) => {
        console.log(`Group ${index + 1}: memberCount=${group.memberCount}, name=${group.groupName}`);
      });
      
      const totalStudents = chartData.reduce((sum, group) => sum + (group.memberCount || 0), 0);
      console.log('\n🎯 Total students calculated:', totalStudents);
      
      console.log('\n🔍 First group complete data:');
      console.log(JSON.stringify(chartData[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testWithFreshToken();