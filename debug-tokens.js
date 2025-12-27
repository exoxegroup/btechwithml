const jwt = require('jsonwebtoken');
require('dotenv').config();

// Sample student tokens from the test (you'll need to get these from the actual test run)
const studentTokens = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InN0dWRlbnQxX3Rlc3RfaWQiLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDAwfQ.sample',
  // Add more tokens as needed
];

console.log('JWT Secret:', process.env.JWT_SECRET);

// Test decoding a token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InN0dWRlbnQxX3Rlc3RfaWQiLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDAwfQ.sample';

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}