const axios = require('axios');

async function testMemberCount() {
  try {
    // First, let's get a valid class ID from the database
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'n@gmail.com',
      password: 'Hamdala456'
    });
    
    const token = loginResponse.data.token;
    console.log('Logged in successfully, token:', token);
    
    // Get classes
    const classesResponse = await axios.get('http://localhost:3001/api/classes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Available classes:', classesResponse.data.map(c => ({ id: c.id, name: c.name })));
    
    if (classesResponse.data.length > 0) {
      // Use the class with 9 students (cmj6aol7d0002t91qezlzjrhu)
      const classId = 'cmj6aol7d0002t91qezlzjrhu';
      console.log('Testing with class ID:', classId);
      
      // Get group performance data
      const performanceResponse = await axios.get(`http://localhost:3001/api/analytics/class/${classId}/performance-data?chartType=line`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Performance data response:', JSON.stringify(performanceResponse.data, null, 2));
      
      // Check if memberCount is present
      const chartData = performanceResponse.data.data?.chartData || [];
      if (chartData.length > 0) {
        console.log('First group data:', chartData[0]);
        console.log('memberCount field present:', 'memberCount' in chartData[0]);
        console.log('memberCount value:', chartData[0].memberCount);
      } else {
        console.log('No chart data found');
      }
    }
    
  } catch (error) {
    console.error('Error testing member count:', error.response?.data || error.message);
  }
}

testMemberCount();