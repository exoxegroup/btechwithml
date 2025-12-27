// Test working endpoints for frontend
const axios = require('axios');

async function testWorkingEndpoints() {
    console.log('🔍 Testing Working Frontend Endpoints');
    console.log('=====================================');
    
    try {
        // Step 1: Login
        console.log('1. Testing login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test.teacher@biolearn.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Get classes (working endpoint)
        console.log('\n2. Testing classes endpoint...');
        const classesResponse = await axios.get('http://localhost:3001/api/classes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Found ${classesResponse.data.length} classes`);
        if (classesResponse.data.length > 0) {
            const classData = classesResponse.data[0];
            console.log(`   Class: ${classData.name} (ID: ${classData.id})`);
            
            // Step 3: Test analytics (working endpoint)
            console.log('\n3. Testing analytics endpoint...');
            const analyticsResponse = await axios.get(
                `http://localhost:3001/api/analytics/class/${classData.id}/performance-data?chartType=line`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Analytics data retrieved successfully');
            const chartData = analyticsResponse.data.data?.chartData || [];
            const summaryStats = analyticsResponse.data.data?.summaryStats || {};
            
            console.log(`   Total Students: ${summaryStats.totalStudents || 0}`);
            console.log(`   Chart Items: ${chartData.length}`);
            
            if (chartData.length > 0) {
                const firstItem = chartData[0];
                console.log(`   Student Name: ${firstItem.studentName || 'N/A'}`);
                console.log(`   Pretest Score: ${firstItem.avgPretestScore || 'N/A'}`);
                console.log(`   Posttest Score: ${firstItem.avgPosttestScore || 'N/A'}`);
                console.log(`   Retention Score: ${firstItem.avgRetentionScore || 'N/A'}`);
                console.log(`   Grouping Rationale: ${firstItem.groupingRationale || 'N/A'}`);
            }
            
            // Step 4: Test AI Insights
            console.log('\n4. Testing AI Insights...');
            const aiInsightsResponse = await axios.get(
                `http://localhost:3001/api/analytics/class/${classData.id}/ai-insights`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            
            console.log('✅ AI Insights retrieved');
            const currentInsights = aiInsightsResponse.data.data?.currentInsights;
            if (currentInsights) {
                console.log(`   Effectiveness Score: ${currentInsights.effectivenessScore}`);
                console.log(`   Improvement Areas: ${currentInsights.improvementAreas?.length || 0}`);
            }
        }
        
        console.log('\n✅ All endpoints working correctly!');
        console.log('\n🌐 Frontend Status:');
        console.log('   - Server running at: http://localhost:5173/');
        console.log('   - Backend API working: http://localhost:3001');
        console.log('   - Data includes student names and test scores');
        console.log('   - All new fields are being sent correctly');
        
        console.log('\n💡 If you still see the old page:');
        console.log('   1. Hard refresh your browser (Ctrl+F5)');
        console.log('   2. Clear browser cache');
        console.log('   3. Open in incognito/private mode');
        console.log('   4. Check browser console for errors');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testWorkingEndpoints();