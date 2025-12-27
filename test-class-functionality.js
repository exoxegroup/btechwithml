const axios = require('axios');

async function testClassFunctionality() {
  try {
    console.log('Testing class functionality...');
    
    // Test login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'n@gmail.com',
      password: 'Hamdala456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Test getting teacher classes
    console.log('\n2. Testing get teacher classes...');
    const classesResponse = await axios.get('http://localhost:3001/api/classes/teacher', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Classes response:', JSON.stringify(classesResponse.data, null, 2));
    
    // Test getting specific class
    console.log('\n3. Testing get specific class...');
    const classResponse = await axios.get('http://localhost:3001/api/classes/cmj6aol7d0002t91qezlzjrhu', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Class details:', JSON.stringify(classResponse.data, null, 2));
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.error('Class not found or endpoint not available');
    }
  }
}

testClassFunctionality();