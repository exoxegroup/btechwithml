const axios = require('axios');

async function debugPerformanceData() {
    console.log('🔍 Debugging Performance Data...');
    
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
        console.log('📊 Full Response Data:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

debugPerformanceData();