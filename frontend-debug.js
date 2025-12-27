// Test if the frontend is actually calling the right endpoint
// Add this to the browser console to debug

console.log('=== FRONTEND API DEBUG ===');
console.log('API_URL:', window.location.origin);

// Override fetch to log all requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    console.log('📡 FETCH REQUEST:', args[0], args[1]);
    
    try {
        const response = await originalFetch(...args);
        console.log('📡 FETCH RESPONSE:', response.status, response.statusText);
        
        // Log response body
        const clone = response.clone();
        const text = await clone.text();
        console.log('📡 RESPONSE BODY:', text);
        
        return response;
    } catch (error) {
        console.error('📡 FETCH ERROR:', error);
        throw error;
    }
};

// Now trigger the analytics fetch
console.log('🔄 Triggering analytics fetch...');

// This simulates what the useAnalytics hook does
fetch('/api/analytics/class/cmj6aol7d0002t91qezlzjrhu/performance-data?chartType=line', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
    }
}).then(response => {
    console.log('✅ Analytics fetch completed');
}).catch(error => {
    console.error('❌ Analytics fetch failed:', error);
});