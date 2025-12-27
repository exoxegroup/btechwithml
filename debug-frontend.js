const axios = require('axios');

async function debugFrontendData() {
  try {
    console.log('=== Debugging Frontend Data Flow ===\n');
    
    // Login as the teacher
    console.log('1. Logging in as teacher...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'n@gmail.com',
      password: 'Hamdala456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test the exact API endpoint the frontend uses
    console.log('\n2. Testing /performance-data endpoint (like frontend)...');
    const performanceResponse = await axios.get(
      'http://localhost:3001/api/analytics/class/cmj6aol7d0002t91qezlzjrhu/performance-data?chartType=line',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log('✅ Performance data response structure:');
    console.log('Response keys:', Object.keys(performanceResponse.data));
    console.log('Data keys:', Object.keys(performanceResponse.data.data));
    console.log('Chart data length:', performanceResponse.data.data.chartData?.length);
    
    // Check each group for memberCount
    if (performanceResponse.data.data.chartData) {
      console.log('\n3. Checking memberCount in each group...');
      performanceResponse.data.data.chartData.forEach((group, index) => {
        console.log(`Group ${index + 1}:`, {
          groupId: group.groupId,
          groupName: group.groupName,
          memberCount: group.memberCount,
          hasMemberCount: 'memberCount' in group
        });
      });
      
      // Calculate total students like the frontend does
      const totalStudents = performanceResponse.data.data.chartData.reduce((sum, g) => {
        return sum + (g.memberCount || 0);
      }, 0);
      
      console.log('\n4. Total students calculation:');
      console.log('Total from memberCount fields:', totalStudents);
      console.log('Total from summaryStats:', performanceResponse.data.data.summaryStats?.totalStudents);
      
      // Check if frontend would get empty array
      const whatFrontendGets = performanceResponse.data.data.chartData || [];
      console.log('\n5. What frontend receives:', whatFrontendGets.length, 'groups');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugFrontendData();