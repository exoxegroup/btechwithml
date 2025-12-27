const axios = require('axios');

async function debugMemberCount() {
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
    
    console.log('\n=== BACKEND RESPONSE ===');
    console.log('Response structure check:');
    console.log('- Has data property:', !!response.data.data);
    console.log('- Has chartData property:', !!response.data.data.chartData);
    console.log('- ChartData length:', response.data.data.chartData.length);
    
    if (response.data.data.chartData.length > 0) {
      const firstItem = response.data.data.chartData[0];
      console.log('\nFirst item properties:');
      Object.keys(firstItem).forEach(key => {
        console.log(`  ${key}: ${firstItem[key]} (type: ${typeof firstItem[key]})`);
      });
      
      console.log('\nMemberCount specific check:');
      console.log('- Has memberCount property:', 'memberCount' in firstItem);
      console.log('- memberCount value:', firstItem.memberCount);
      console.log('- memberCount type:', typeof firstItem.memberCount);
    }
    
    // Now let's test what the frontend API function returns
    console.log('\n=== FRONTEND API SIMULATION ===');
    
    // Simulate what the frontend does
    const chartData = response.data.data.chartData || [];
    console.log('Frontend would receive chartData with length:', chartData.length);
    
    if (chartData.length > 0) {
      console.log('First item memberCount (frontend view):', chartData[0].memberCount);
      
      // Check if there's any property that might be memberCount with different name
      const firstItem = chartData[0];
      const possibleProps = Object.keys(firstItem).filter(key => 
        key.toLowerCase().includes('member') || key.toLowerCase().includes('count') || key.toLowerCase().includes('student')
      );
      console.log('Possible member count properties:', possibleProps);
      
      // Calculate total like frontend would
      const total = chartData.reduce((sum, g) => sum + (g.memberCount || 0), 0);
      console.log('Total students calculation:', total);
    }
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

debugMemberCount();