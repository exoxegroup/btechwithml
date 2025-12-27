// Test to verify frontend authentication and data loading
const axios = require('axios');

async function testFrontendAuth() {
    console.log('🔍 Testing Frontend Authentication & Data Loading');
    console.log('==================================================');
    
    try {
        // Step 1: Test login endpoint
        console.log('1. Testing login endpoint...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test.teacher@biolearn.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log(`   Token: ${token.substring(0, 20)}...`);
        
        // Step 2: Test user profile
        console.log('\n2. Testing user profile...');
        const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Profile loaded: ${profileResponse.data.name} (${profileResponse.data.email})`);
        
        // Step 3: Test classes endpoint
        console.log('\n3. Testing classes endpoint...');
        const classesResponse = await axios.get('http://localhost:3001/api/classes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Found ${classesResponse.data.length} classes`);
        if (classesResponse.data.length > 0) {
            const classData = classesResponse.data[0];
            console.log(`   Class: ${classData.name} (ID: ${classData.id})`);
            
            // Step 4: Test analytics endpoint with the class
            console.log('\n4. Testing analytics endpoint...');
            const analyticsResponse = await axios.get(
                `http://localhost:3001/api/analytics/class/${classData.id}/performance-data?chartType=line`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Analytics data retrieved');
            const chartData = analyticsResponse.data.data?.chartData || [];
            const summaryStats = analyticsResponse.data.data?.summaryStats || {};
            
            console.log(`   Total Students: ${summaryStats.totalStudents || 0}`);
            console.log(`   Chart Items: ${chartData.length}`);
            
            if (chartData.length > 0) {
                const firstItem = chartData[0];
                console.log(`   First Item: ${firstItem.studentName || firstItem.groupName} (Score: ${firstItem.averageScore})`);
                console.log(`   Has studentName: ${!!firstItem.studentName}`);
                console.log(`   Has groupingRationale: ${!!firstItem.groupingRationale}`);
                console.log(`   Is Individual: ${firstItem.isIndividual}`);
            }
        }
        
        console.log('\n✅ All API endpoints working correctly!');
        console.log('\n🌐 Frontend should be working if:');
        console.log('   - You are logged in at http://localhost:5173/');
        console.log('   - You navigate to Class Management');
        console.log('   - You select your class and go to Analytics');
        console.log('   - The page should show student names and test scores');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testFrontendAuth();