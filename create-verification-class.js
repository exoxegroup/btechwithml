const axios = require('axios');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNta2VldWhoOTAwMDBxemx0YzV3dzJyaXYiLCJuYW1lIjoiVGVzdCBUZWFjaGVyIiwiZW1haWwiOiJ0ZWFjaGVyX3Rlc3RAc2Nob29sLmVkdSIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNzY4NDE4NzQxLCJleHAiOjE3NjkwMjM1NDF9.o9Nc9vPn_D-1f6quETKNiKF8cj7-P_XFvJ-d8sxPj18';

async function createClass() {
  try {
    const response = await axios.post('http://localhost:3001/api/classes', {
      name: 'Verification Class',
      description: 'Class for Phase 4 verification',
      subject: 'Biology',
      grade: '10'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('Class Created:', response.data);
    console.log('Class ID:', response.data.id);
  } catch (error) {
    console.error('Error creating class:', error.response?.data || error.message);
  }
}

createClass();
