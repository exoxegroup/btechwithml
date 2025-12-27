// Test the AI grouping functionality with the fixed response structure
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWk4aG5qNHkwMDAxbWgwcTR6Z2xvb2F3IiwiZW1haWwiOiJ0ZWFjaGVyQGV4YW1wbGUuY29tIiwicm9sZSI6InRlYWNoZXIiLCJpYXQiOjE3MzQyNTY4NDUsImV4cCI6MTczNjg0ODg0NX0.qZ8Y5zK8x1H3m2nP4b7vC9d0e2F5g8hJ1k3l6n9p2s5";
const classId = 'cmj6aol7d0002t91qezlzjrhu';

console.log('Testing AI grouping with fixed response structure...');

fetch(`http://localhost:3003/api/classes/${classId}/ai-grouping`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Response body:', text);
  try {
    const data = JSON.parse(text);
    console.log('Parsed JSON:', data);
    
    // Check if the response has the expected structure
    if (data.groups && data.groups.length > 0) {
      console.log('✅ SUCCESS: Response contains groups array');
      console.log('Number of groups:', data.groups.length);
      console.log('First group:', data.groups[0]);
    } else {
      console.log('❌ ISSUE: Response does not contain groups array');
      console.log('Available properties:', Object.keys(data));
    }
  } catch (e) {
    console.log('Could not parse as JSON:', e.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});