// Test if exports are working
const api = require('./frontend/src/services/api.ts');
console.log('Available exports:', Object.keys(api));
console.log('generateManualGroups:', typeof api.generateManualGroups);
console.log('AIGroupingResult:', typeof api.AIGroupingResult);