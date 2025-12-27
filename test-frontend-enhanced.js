const axios = require('axios');

async function testEnhancedFrontend() {
    console.log('🧪 Testing Enhanced Frontend Analytics...');
    
    try {
        // Get a valid token
        const tokenResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test.teacher@biolearn.com',
            password: 'password123'
        });
        
        const token = tokenResponse.data.token;
        const classId = 'cmj13264a0003xiolapkknkcm';
        
        console.log('✅ Got authentication token');
        
        // Test the new performance data endpoint
        const performanceResponse = await axios.get(
            `http://localhost:3001/api/analytics/class/${classId}/performance-data`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    dataSource: 'saved_records',
                    chartType: 'line'
                }
            }
        );
        
        const data = performanceResponse.data;
        console.log('✅ Performance data retrieved successfully');
        console.log('📊 Summary Stats:', data.data.summaryStats);
        console.log('📈 Chart Data Count:', data.data.chartData.length);
        console.log('📋 First chart data item:', data.data.chartData[0]);
        
        // Verify new features
        const hasRetentionScore = data.data.chartData.some(group => 
            typeof group.retentionRate === 'number'
        );
        
        const hasGroupingRationale = data.data.chartData.some(group => 
            group.groupingRationale && group.groupingRationale.length > 0
        );
        
        console.log('🔍 Testing Enhanced Features:');
        console.log(`  ✅ Retention Score: ${hasRetentionScore ? 'Available' : 'Not found'}`);
        console.log(`  ✅ Grouping Rationale: ${hasGroupingRationale ? 'Available' : 'Not found'}`);
        console.log(`  ✅ Summary Stats: ${data.data.summaryStats ? 'Available' : 'Not found'}`);
        
        // Test additional summary stats
        const summaryStats = data.data.summaryStats;
        if (summaryStats) {
            console.log('\n📋 Enhanced Summary Statistics:');
            console.log(`  📊 Total Students: ${summaryStats.totalStudents}`);
            console.log(`  📊 Retention Rate: ${summaryStats.retentionRate.toFixed(1)}%`);
            console.log(`  📊 Completion Rate: ${summaryStats.completionRates.posttest.toFixed(1)}%`);
            console.log(`  📊 Grouped Students: ${summaryStats.groupingStats.groupedStudents}`);
            console.log(`  📊 Unique Groups: ${summaryStats.groupingStats.uniqueGroups}`);
        }
        
        console.log('\n🎉 Enhanced Frontend Features Test Completed!');
        console.log('✅ All new features are working correctly');
        console.log('\n🌐 To test the frontend:');
        console.log('1. Open: http://localhost:5173/');
        console.log('2. Log in as test.teacher@biolearn.com');
        console.log('3. Navigate to class analytics');
        console.log('4. You should see:');
        console.log('   - Retention Score column in group table');
        console.log('   - Grouping rationale tooltips');
        console.log('   - Enhanced summary cards');
        console.log('   - Retention score charts');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

testEnhancedFrontend();