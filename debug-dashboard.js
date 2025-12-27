// Quick debug script to check what's happening in the browser
(() => {
  console.log('=== TEACHER DASHBOARD DEBUG ===');
  
  // Check if user is logged in
  const token = localStorage.getItem('authToken');
  console.log('Token exists:', !!token);
  console.log('Token:', token ? token.substring(0, 50) + '...' : 'No token');
  
  // Check if we can make the API call
  if (token) {
    fetch('http://localhost:3001/api/classes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      return response.json();
    })
    .then(data => {
      console.log('API Response data:', data);
      console.log('Number of classes:', data.length);
    })
    .catch(error => {
      console.error('API Error:', error);
    });
  }
  
  // Check localStorage for any cached data
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('authToken:', localStorage.getItem('authToken'));
  console.log('user:', localStorage.getItem('user'));
})();