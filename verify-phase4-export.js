
const axios = require('axios');

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNta2VldWhoOTAwMDBxemx0YzV3dzJyaXYiLCJuYW1lIjoiVGVzdCBUZWFjaGVyIiwiZW1haWwiOiJ0ZWFjaGVyX3Rlc3RAc2Nob29sLmVkdSIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNzY4NDE5MzkxLCJleHAiOjE3NjkwMjQxOTF9.O0oXw-jzNe9weaoaDzHXTerKWW_J0hqV4i5vrrlIc2A';
const TEST_CLASS_ID = 'cmkeew2t50002qzlt4tn9pn9g';

async function verifyExport() {
  console.log('🧪 Starting Phase 4 Export Verification...\n');

  try {
    // 1. Initiate Export (JSON)
    console.log('📊 Test 1: Initiate Research Data Export (JSON)');
    const initResponse = await axios.post(
      `http://localhost:3001/api/analytics/class/${TEST_CLASS_ID}/export`,
      {
        exportType: 'INDIVIDUAL_PERFORMANCE',
        fileFormat: 'JSON',
        anonymizationLevel: 'NONE'
      },
      {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      }
    );

    console.log('✅ Export initiated successfully');
    const exportId = initResponse.data.data.exportId;
    console.log('📦 Export ID:', exportId);

    // 2. Check Status
    console.log('\n📊 Test 2: Check Export Status');
    const statusResponse = await axios.get(
      `http://localhost:3001/api/analytics/export/${exportId}/status`,
      {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      }
    );
    console.log('✅ Status retrieved:', statusResponse.data.data.status);

    // 3. Download Export
    console.log('\n📊 Test 3: Download Export Data');
    const downloadResponse = await axios.get(
      `http://localhost:3001/api/analytics/export/${exportId}/download`,
      {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      }
    );
    
    console.log('✅ Download successful');
    const data = downloadResponse.data;
    console.log('📄 Record count:', data.length);
    
    if (data.length > 0) {
      console.log('🔍 Sample Record:', data[0]);
      if (data[0].pretestScore === 100) {
        console.log('✅ Data matches High Performer seed');
      }
    }

    // 4. Initiate Export (CSV)
    console.log('\n📊 Test 4: Initiate Research Data Export (CSV)');
    const csvInitResponse = await axios.post(
      `http://localhost:3001/api/analytics/class/${TEST_CLASS_ID}/export`,
      {
        exportType: 'INDIVIDUAL_PERFORMANCE',
        fileFormat: 'CSV',
        anonymizationLevel: 'PSEUDONYMIZED'
      },
      {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      }
    );
    const csvExportId = csvInitResponse.data.data.exportId;
    
    // 5. Download CSV
    console.log('\n📊 Test 5: Download CSV Export');
    const csvDownloadResponse = await axios.get(
      `http://localhost:3001/api/analytics/export/${csvExportId}/download`,
      {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      }
    );
    
    console.log('✅ CSV Download successful');
    console.log('📄 CSV Content Preview:');
    console.log(csvDownloadResponse.data.substring(0, 200) + '...');

    console.log('\n🎉 Phase 4 Export Verification COMPLETED!');

  } catch (error) {
    console.log('❌ Export verification failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

verifyExport();
