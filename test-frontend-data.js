// Simple test to verify frontend data structure
const axios = require('axios');

async function testFrontendData() {
    try {
        // Get authentication token
        const tokenResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test.teacher@biolearn.com',
            password: 'password123'
        });
        
        const token = tokenResponse.data.token;
        console.log('✅ Got authentication token');
        
        // Test the exact endpoint the frontend uses
        const classId = 'cmj13264a0003xiolapkknkcm';
        const response = await axios.get(
            `http://localhost:3001/api/analytics/class/${classId}/performance-data?chartType=line`,
            {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Frontend endpoint working');
        console.log('📊 Response structure:', JSON.stringify(response.data, null, 2));
        
        if (response.data.data && response.data.data.chartData) {
            console.log('\n📈 Chart Data:');
            response.data.data.chartData.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.studentName || item.groupName} - Score: ${item.averageScore}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testFrontendData();