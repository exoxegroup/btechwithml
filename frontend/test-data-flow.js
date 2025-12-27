// Simple test to verify API response structure
async function testFrontendData() {
  try {
    const token = localStorage.getItem('token'); // Or however you store the token
    const classId = 'cmj6aol7d0002t91qezlzjrhu'; // Your class ID
    
    console.log('Testing frontend data retrieval...');
    
    const response = await fetch(`http://localhost:3001/api/analytics/class/${classId}/performance-data?chartType=line`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('Full response:', JSON.stringify(result, null, 2));
    
    if (result.data?.chartData) {
      console.log('Chart data validation:');
      result.data.chartData.forEach((group, index) => {
        console.log(`Group ${index + 1}:`, {
          groupId: group.groupId,
          groupName: group.groupName,
          memberCount: group.memberCount,
          memberCountType: typeof group.memberCount
        });
      });
      
      const totalStudents = result.data.chartData.reduce((sum, g) => sum + (g.memberCount || 0), 0);
      console.log('Total students calculated:', totalStudents);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testFrontendData();