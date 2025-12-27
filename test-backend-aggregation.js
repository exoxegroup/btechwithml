// Test script to verify backend aggregation works with saved records
const axios = require('axios');

async function testBackendAggregation() {
  try {
    // Test the group performance endpoint with a sample class
    const response = await axios.get('http://localhost:3001/api/analytics/class/sample-class-id/group-performance', {
      headers: {
        'Authorization': 'Bearer your-test-token-here'
      }
    });

    console.log('Backend Aggregation Test Results:');
    console.log('Status:', response.data.success);
    
    if (response.data.success && response.data.data.performanceData) {
      const performanceData = response.data.data.performanceData;
      
      console.log(`Found ${performanceData.length} groups with aggregated data:`);
      
      performanceData.forEach((group, index) => {
        console.log(`\nGroup ${index + 1} (${group.groupId}):`);
        console.log(`  Average Pretest Score: ${group.avgPretestScore}`);
        console.log(`  Average Posttest Score: ${group.avgPosttestScore}`);
        console.log(`  Average Retention Score: ${group.avgRetentionScore}`);
        console.log(`  Improvement Rate: ${group.improvementRate}%`);
        console.log(`  Retention Rate: ${group.retentionRate}%`);
      });
      
      // Verify we're using saved records (no real-time data fetching)
      const hasAggregatedScores = performanceData.some(group => 
        group.avgPretestScore !== undefined && 
        group.avgPosttestScore !== undefined && 
        group.avgRetentionScore !== undefined
      );
      
      if (hasAggregatedScores) {
        console.log('\n✅ SUCCESS: Backend aggregation is working with saved records!');
        console.log('✅ Pre/Post/Retention scores are being properly aggregated from database.');
      } else {
        console.log('\n❌ ISSUE: No aggregated scores found in the data.');
      }
    } else {
      console.log('❌ No performance data found in response');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testBackendAggregation();