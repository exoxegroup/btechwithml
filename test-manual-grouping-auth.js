// Test manual grouping with proper authentication
const API_BASE = 'http://localhost:3001/api';

async function testManualGroupingWithAuth() {
  console.log('🔍 Testing Manual Grouping API with Authentication');
  console.log('');

  try {
    // Step 1: Login to get a valid token
    console.log('Step 1: Logging in to get authentication token...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed - using test token instead');
      // Try with a test token for existing data
      await testWithTestToken();
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token obtained');
    console.log('');

    // Step 2: Get available classes
    console.log('Step 2: Getting available classes...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!classesResponse.ok) {
      console.log('❌ Failed to get classes');
      return;
    }

    const classesData = await classesResponse.json();
    console.log('✅ Classes retrieved successfully');
    console.log(`Found ${classesData.length} classes`);
    
    if (classesData.length === 0) {
      console.log('⚠️  No classes found - creating test scenario');
      await testManualGroupingErrorCases(token);
      return;
    }

    // Use the first class for testing
    const testClass = classesData[0];
    console.log(`Testing with class: ${testClass.name} (ID: ${testClass.id})`);
    console.log('');

    // Step 3: Test manual grouping
    console.log('Step 3: Testing manual grouping...');
    const manualGroupingResponse = await fetch(`${API_BASE}/classes/${testClass.id}/manual-grouping`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Manual grouping response status: ${manualGroupingResponse.status}`);
    
    if (manualGroupingResponse.ok) {
      const groupingData = await manualGroupingResponse.json();
      console.log('✅ Manual grouping successful!');
      console.log('Grouping result:', JSON.stringify(groupingData, null, 2));
    } else {
      const errorData = await manualGroupingResponse.json();
      console.log('❌ Manual grouping failed:');
      console.log('Error:', JSON.stringify(errorData, null, 2));
    }

  } catch (error) {
    console.log('❌ Error during testing:', error.message);
  }
}

async function testWithTestToken() {
  console.log('Trying with test token approach...');
  // This would test with existing data if available
  console.log('Please ensure you have test data set up in the database');
}

async function testManualGroupingErrorCases(token) {
  console.log('Testing manual grouping error scenarios...');
  
  // Test with a non-existent class ID
  console.log('Testing with non-existent class ID...');
  const response = await fetch(`${API_BASE}/classes/non-existent-class/manual-grouping`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`Response status: ${response.status}`);
  if (response.status === 404) {
    console.log('✅ Correctly returned 404 for non-existent class');
  } else {
    const data = await response.json();
    console.log('Response:', data);
  }
}

// Run the test
testManualGroupingWithAuth();