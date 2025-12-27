const axios = require('axios');

async function debugClassIssues() {
  try {
    console.log('🔍 Debugging class functionality issues...\n');
    
    // Test 1: Basic backend health check
    console.log('1️⃣ Testing backend health...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/api/health');
      console.log('✅ Backend is healthy:', healthResponse.data);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }
    
    // Test 2: Login with teacher credentials
    console.log('\n2️⃣ Testing teacher login...');
    let token;
    try {
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'n@gmail.com',
        password: 'Hamdala456'
      });
      token = loginResponse.data.token;
      console.log('✅ Login successful, token received:', token.substring(0, 20) + '...');
      console.log('User data:', loginResponse.data.user);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('   - Invalid credentials');
      } else if (error.response?.status === 404) {
        console.log('   - User not found');
      }
      return;
    }
    
    // Test 3: Get teacher classes
    console.log('\n3️⃣ Testing get teacher classes...');
    try {
      const classesResponse = await axios.get('http://localhost:3001/api/classes/teacher', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Classes retrieved successfully');
      console.log('Number of classes:', classesResponse.data.classes?.length || 0);
      console.log('Classes data:', JSON.stringify(classesResponse.data.classes, null, 2));
    } catch (error) {
      console.log('❌ Get classes failed:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        console.log('   - Classes endpoint not found');
      } else if (error.response?.status === 401) {
        console.log('   - Unauthorized - token issue');
      }
    }
    
    // Test 4: Get specific class by ID
    console.log('\n4️⃣ Testing get specific class...');
    try {
      const classResponse = await axios.get('http://localhost:3001/api/classes/cmj6aol7d0002t91qezlzjrhu', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Class retrieved successfully');
      console.log('Class data:', JSON.stringify(classResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Get specific class failed:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        console.log('   - Class not found');
      }
    }
    
    // Test 5: Test analytics endpoint
    console.log('\n5️⃣ Testing analytics endpoint...');
    try {
      const analyticsResponse = await axios.get('http://localhost:3001/api/analytics/class/cmj6aol7d0002t91qezlzjrhu/performance-data?chartType=line', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Analytics data retrieved');
      console.log('Chart data length:', analyticsResponse.data.data?.chartData?.length || 0);
      
      const chartData = analyticsResponse.data.data?.chartData;
      if (chartData && chartData.length > 0) {
        console.log('First group memberCount:', chartData[0].memberCount);
        console.log('All memberCounts:', chartData.map(g => g.memberCount));
      }
    } catch (error) {
      console.log('❌ Analytics failed:', error.response?.data || error.message);
    }
    
    console.log('\n🔍 Debug completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

debugClassIssues();