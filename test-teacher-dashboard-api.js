const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testTeacherDashboardAPI() {
  try {
    // First, login to get token
    console.log('=== STEP 1: Login as teacher ===');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'n@gmail.com',
      password: 'Hamdala456'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('Login successful!');
    console.log('Teacher ID:', user.id);
    console.log('Teacher email:', user.email);
    
    // Test the exact API call that the frontend makes
    console.log('\n=== STEP 2: Test getTeacherClasses API ===');
    console.log('Making GET request to:', `${API_URL}/classes`);
    console.log('Authorization header:', `Bearer ${token}`);
    
    const classesResponse = await axios.get(`${API_URL}/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', classesResponse.status);
    console.log('Response data:', JSON.stringify(classesResponse.data, null, 2));
    
    // Also test with fetch to match frontend implementation
    console.log('\n=== STEP 3: Test with fetch (like frontend) ===');
    const fetchResponse = await fetch(`${API_URL}/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Fetch response status:', fetchResponse.status);
    const fetchData = await fetchResponse.json();
    console.log('Fetch response data:', JSON.stringify(fetchData, null, 2));
    
    // Test if the response is successful
    if (fetchResponse.ok) {
      console.log('✅ API call successful - classes should be visible');
    } else {
      console.log('❌ API call failed - this is why classes are not showing');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error headers:', error.response.headers);
    }
  }
}

testTeacherDashboardAPI();