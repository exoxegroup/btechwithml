// Minimal test to verify data parsing
async function debugDataParsing() {
  const token = 'your_token_here'; // You'll need to get this from localStorage or wherever it's stored
  const classId = 'cmj6aol7d0002t91qezlzjrhu';
  
  console.log('=== Debug Data Parsing ===');
  
  try {
    const response = await fetch(`http://localhost:3001/api/analytics/class/${classId}/performance-data?chartType=line`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw response text:', responseText.substring(0, 500) + '...');
    
    const data = JSON.parse(responseText);
    console.log('Parsed data structure:', JSON.stringify(data, null, 2));
    
    if (data.data?.chartData && data.data.chartData.length > 0) {
      const firstGroup = data.data.chartData[0];
      console.log('First group keys:', Object.keys(firstGroup));
      console.log('First group memberCount:', firstGroup.memberCount);
      console.log('First group memberCount type:', typeof firstGroup.memberCount);
      
      // Test the exact property access
      console.log('Direct access test:');
      console.log('- data.data.chartData[0].memberCount:', data.data.chartData[0].memberCount);
      console.log('- data["data"]["chartData"][0]["memberCount"]:', data["data"]["chartData"][0]["memberCount"]);
    }
    
  } catch (error) {
    console.error('Debug test failed:', error);
  }
}

// Run this in your browser console when on the analytics page
debugDataParsing();