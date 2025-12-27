const axios = require('axios');

async function testBackendDirectly() {
  try {
    // First, login to get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'n@gmail.com',
      password: 'Hamdala456'
    });
    
    const token = loginResponse.data.token;
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // Test the performance data endpoint directly
    const classId = 'cmj6aol7d0002t91qezlzjrhu';
    const response = await axios.get(
      `http://localhost:3001/api/analytics/class/${classId}/performance-data?chartType=line`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Full API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if chartData has memberCount
    if (response.data.data && response.data.data.chartData) {
      console.log('\nChart data length:', response.data.data.chartData.length);
      if (response.data.data.chartData.length > 0) {
        console.log('\nFirst chart item:');
        console.log(JSON.stringify(response.data.data.chartData[0], null, 2));
        
        console.log('\nAll properties of first chart item:');
        Object.keys(response.data.data.chartData[0]).forEach(key => {
          console.log(`- ${key}: ${response.data.data.chartData[0][key]} (type: ${typeof response.data.data.chartData[0][key]})`);
        });
        
        console.log('\nHas memberCount?', 'memberCount' in response.data.data.chartData[0]);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testBackendDirectly();