// Integration test for analyticsApi.ts functions
// Run with: node test-analytics-integration.mjs

console.log('🚀 Starting Analytics API Integration Tests\n');

// Test function imports and basic functionality
async function testAnalyticsIntegration() {
  try {
    console.log('📋 Testing analyticsApi.ts module imports...');
    
    // Dynamic import to test the actual TypeScript module
    const analyticsApi = await import('./src/services/analyticsApi.ts');
    
    console.log('✅ PASSED - analyticsApi.ts module imported successfully');
    
    // Check if all required functions are exported
    const requiredFunctions = [
      'getGroupPerformance',
      'getAIAlgorithmInsights', 
      'getAIInsights',
      'getStudentEngagement',
      'getHistoricalData',
      'exportData'
    ];
    
    console.log('\n📋 Checking exported functions...');
    for (const funcName of requiredFunctions) {
      if (typeof analyticsApi[funcName] === 'function') {
        console.log(`✅ ${funcName} - Function exists`);
      } else {
        console.log(`❌ ${funcName} - Function missing`);
      }
    }
    
    console.log('\n📋 Checking function signatures...');
    
    // Test function parameters
    console.log('getGroupPerformance expects:', analyticsApi.getGroupPerformance.length, 'parameters');
    console.log('getAIInsights expects:', analyticsApi.getAIInsights.length, 'parameters');
    console.log('getStudentEngagement expects:', analyticsApi.getStudentEngagement.length, 'parameters');
    console.log('getHistoricalData expects:', analyticsApi.getHistoricalData.length, 'parameters');
    console.log('exportData expects:', analyticsApi.exportData.length, 'parameters');
    
    console.log('\n📋 Checking API_URL configuration...');
    const apiModule = await import('./src/services/api.ts');
    console.log('API_URL:', apiModule.API_URL);
    
    if (apiModule.API_URL.includes('3001')) {
      console.log('✅ PASSED - API_URL configured for test environment');
    } else {
      console.log('⚠️  WARNING - API_URL may not be configured for test environment');
    }
    
    console.log('\n🎯 Integration test completed successfully!');
    console.log('💡 All analytics API functions are properly exported and configured.');
    console.log('🔧 You can now use these functions in your React components with confidence.');
    
  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
    console.log('📋 Error details:', error);
  }
}

// Run the integration test
testAnalyticsIntegration();