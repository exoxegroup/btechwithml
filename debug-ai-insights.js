const axios = require('axios');

async function debugAIInsights() {
    try {
        // Get authentication token
        const tokenResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test.teacher@biolearn.com',
            password: 'password123'
        });
        
        const token = tokenResponse.data.token;
        console.log('✅ Got authentication token');
        
        // Test AI Insights endpoint
        const classId = 'cmj13264a0003xiolapkknkcm';
        const aiInsightsResponse = await axios.get(
            `http://localhost:3001/api/analytics/class/${classId}/ai-insights`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );
        
        console.log('✅ AI Insights retrieved successfully');
        console.log('📊 Full AI Insights Response:', JSON.stringify(aiInsightsResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugAIInsights();