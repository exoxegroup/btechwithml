const axios = require('axios');

async function testApiResponse() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'n@gmail.com',
      password: 'Hamdala456'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Test the performance data endpoint
    const response = await axios.get(
      'http://localhost:3001/api/analytics/class/cmj6aol7d0002t91qezlzjrhu/performance-data?chartType=line',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Full API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if chartData exists and has memberCount
    if (response.data.data && response.data.data.chartData) {
      console.log('\nChart data structure:');
      console.log('Number of groups:', response.data.data.chartData.length);
      console.log('First group:', JSON.stringify(response.data.data.chartData[0], null, 2));
      
      // Check memberCount specifically
      response.data.data.chartData.forEach((group, index) => {
        console.log(`Group ${index + 1} memberCount:`, group.memberCount);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testApiResponse();