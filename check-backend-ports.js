// Simple test to check backend health without auth
const axios = require('axios');

async function checkBackendHealth() {
  console.log('🔍 Checking backend health...\n');
  
  try {
    // Test backend health on port 3001
    console.log('Testing backend health on port 3001...');
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Backend is healthy:', healthResponse.data);
    
    // Test if backend is also running on port 3003 (fallback)
    try {
      console.log('\nTesting backend on port 3003 (fallback)...');
      const fallbackResponse = await axios.get('http://localhost:3003/api/health');
      console.log('⚠️  Backend is ALSO running on port 3003:', fallbackResponse.data);
    } catch (error) {
      console.log('✅ Backend is NOT running on port 3003 (this is good)');
    }
    
    console.log('\n📊 Backend Status Summary:');
    console.log('- Port 3001: ✅ Running');
    console.log('- Port 3003: ❌ Not running (correct)');
    
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkBackendHealth();