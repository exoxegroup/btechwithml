// Comprehensive frontend diagnostic
const axios = require('axios');

async function diagnoseFrontend() {
    console.log('🔍 Frontend Analytics Diagnostic');
    console.log('=====================================');
    
    try {
        // Step 1: Get authentication token
        const tokenResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test.teacher@biolearn.com',
            password: 'password123'
        });
        
        const token = tokenResponse.data.token;
        console.log('✅ Authentication successful');
        
        // Step 2: Get user classes
        const classesResponse = await axios.get('http://localhost:3001/api/classes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Found ${classesResponse.data.length} classes`);
        const classId = classesResponse.data[0]?.id;
        
        if (!classId) {
            console.log('❌ No classes found');
            return;
        }
        
        console.log(`📊 Using class: ${classId}`);
        
        // Step 3: Test analytics endpoint
        const analyticsResponse = await axios.get(
            `http://localhost:3001/api/analytics/class/${classId}/performance-data?chartType=line`,
            {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Analytics endpoint working');
        
        // Step 4: Analyze the data
        const chartData = analyticsResponse.data.data?.chartData || [];
        const summaryStats = analyticsResponse.data.data?.summaryStats || {};
        
        console.log('\n📊 Data Analysis:');
        console.log(`   Total Students: ${summaryStats.totalStudents || 0}`);
        console.log(`   Chart Data Items: ${chartData.length}`);
        
        if (chartData.length > 0) {
            console.log('\n📋 First Student Data:');
            const firstItem = chartData[0];
            console.log(`   Name: ${firstItem.studentName || firstItem.groupName}`);
            console.log(`   Is Individual: ${firstItem.isIndividual}`);
            console.log(`   Pretest Score: ${firstItem.avgPretestScore}`);
            console.log(`   Posttest Score: ${firstItem.avgPosttestScore}`);
            console.log(`   Retention Score: ${firstItem.avgRetentionScore}`);
            console.log(`   Grouping Rationale: ${firstItem.groupingRationale}`);
        }
        
        // Step 5: Test AI Insights
        try {
            const aiInsightsResponse = await axios.get(
                `http://localhost:3001/api/analytics/class/${classId}/ai-insights`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            
            console.log('✅ AI Insights working');
            const currentInsights = aiInsightsResponse.data.data?.currentInsights;
            if (currentInsights) {
                console.log(`   Effectiveness Score: ${currentInsights.effectivenessScore}`);
                console.log(`   Improvement Areas: ${currentInsights.improvementAreas?.length || 0}`);
                console.log(`   Recommendations: ${currentInsights.recommendations?.length || 0}`);
            }
        } catch (aiError) {
            console.log('⚠️  AI Insights error:', aiError.message);
        }
        
        console.log('\n✅ Diagnostic Complete');
        console.log('\n🌐 To see the frontend:');
        console.log('1. Open: http://localhost:5173/');
        console.log('2. Log in with: test.teacher@biolearn.com / password123');
        console.log('3. Navigate to your class analytics');
        console.log('4. You should see student names and test scores');
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

diagnoseFrontend();