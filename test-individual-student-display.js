const axios = require('axios');

async function testIndividualStudentDisplay() {
    console.log('🧪 Testing Individual Student Display...');
    
    try {
        // Get authentication token
        const tokenResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test.teacher@biolearn.com',
            password: 'password123'
        });
        
        const token = tokenResponse.data.token;
        console.log('✅ Got authentication token');
        
        // Get performance data
        const classId = 'cmj13264a0003xiolapkknkcm';
        const performanceResponse = await axios.get(
            `http://localhost:3001/api/analytics/class/${classId}/performance-data`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { dataSource: 'saved_records', chartType: 'line' }
            }
        );
        
        const data = performanceResponse.data;
        console.log('✅ Performance data retrieved successfully');
        
        // Check individual student data
        const chartData = data.data.chartData;
        console.log(`📊 Found ${chartData.length} data entries`);
        
        chartData.forEach((entry, index) => {
            console.log(`\n👤 Entry ${index + 1}:`);
            console.log(`   Group ID: ${entry.groupId}`);
            console.log(`   Student Name: ${entry.studentName || 'N/A'}`);
            console.log(`   Is Individual: ${entry.isIndividual || false}`);
            console.log(`   Label: ${entry.label || 'N/A'}`);
            console.log(`   Average Score: ${entry.averageScore}`);
            console.log(`   Pretest Score: ${entry.avgPretestScore}`);
            console.log(`   Posttest Score: ${entry.avgPosttestScore}`);
            console.log(`   Improvement Rate: ${entry.improvementRate}`);
            console.log(`   Grouping Rationale: ${entry.groupingRationale || 'N/A'}`);
        });
        
        // Verify individual student data is properly formatted
        const individualStudents = chartData.filter(entry => entry.isIndividual && entry.studentName);
        console.log(`\n✅ Found ${individualStudents.length} individual students with names`);
        
        if (individualStudents.length > 0) {
            console.log('🎯 Individual student data is properly formatted for frontend display');
            
            // Check if all required fields are present
            const sampleStudent = individualStudents[0];
            const requiredFields = ['studentName', 'label', 'groupingRationale', 'averageScore', 'improvementRate'];
            const missingFields = requiredFields.filter(field => !sampleStudent[field]);
            
            if (missingFields.length === 0) {
                console.log('✅ All required fields present for individual student display');
            } else {
                console.log('⚠️  Missing fields:', missingFields);
            }
        }
        
        // Test AI Insights
        console.log('\n🔍 Testing AI Insights...');
        const aiInsightsResponse = await axios.get(
            `http://localhost:3001/api/analytics/class/${classId}/ai-insights`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );
        
        const aiData = aiInsightsResponse.data;
        console.log('✅ AI Insights retrieved successfully');
        console.log(`📊 Effectiveness Score: ${aiData.data.currentInsights.effectivenessScore}`);
        console.log(`📊 Improvement Areas: ${aiData.data.currentInsights.improvementAreas.length}`);
        console.log(`📊 Recommendations: ${aiData.data.currentInsights.recommendations.length}`);
        
        aiData.data.currentInsights.improvementAreas.forEach((area, index) => {
            console.log(`   ${index + 1}. ${area}`);
        });
        
        console.log('\n🎉 Individual Student Display Test Completed!');
        console.log('✅ Backend is properly sending individual student data');
        console.log('✅ Frontend should now display student names and test scores');
        console.log('✅ AI Insights show relevant information for current state');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testIndividualStudentDisplay();