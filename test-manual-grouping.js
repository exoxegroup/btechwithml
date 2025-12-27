// Test manual grouping API
const API_URL = 'http://localhost:3001/api';

async function testManualGrouping() {
  try {
    // First, let's try to get a list of classes
    console.log('Testing manual grouping API...');
    
    // Test with a sample class ID (you may need to adjust this)
    const classId = 'test-class-id';
    const token = 'test-token';
    
    const response = await fetch(`${API_URL}/classes/${classId}/manual-grouping`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing manual grouping:', error.message);
  }
}

testManualGrouping();