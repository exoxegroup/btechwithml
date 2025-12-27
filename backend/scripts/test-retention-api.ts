const API_BASE = 'http://localhost:3001/api';

async function testRetentionTestAPI() {
  console.log('🧪 Testing Retention Test API Endpoints');
  
  try {
    // Test 1: Check if we can get class details (this will tell us if data exists)
    console.log('\n📋 Test 1: Getting class details...');
    
    // First, let's try to login to get a token
    console.log('🔑 Attempting to login as teacher...');
    const teacherLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.teacher@biolearn.com',
        password: 'password123'
      })
    });
    
    const teacherLoginData = await teacherLogin.json();
    
    if (teacherLoginData.success) {
      console.log('✅ Teacher login successful');
      const teacherToken = teacherLoginData.token;
      
      // Try to get teacher classes
      const classesResponse = await fetch(`${API_BASE}/classes`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      
      const classesData = await classesResponse.json();
      console.log(`📚 Found ${classesData.classes?.length || 0} classes`);
      
      if (classesData.classes && classesData.classes.length > 0) {
        const testClass = classesData.classes[0];
        console.log(`🎯 Using class: ${testClass.name} (${testClass.id})`);
        
        // Test 2: Try to create a retention test
        console.log('\n📝 Test 2: Creating retention test...');
        
        try {
          const retentionTestResponse = await fetch(
            `${API_BASE}/classes/${testClass.id}/quiz`,
            {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${teacherToken}` 
              },
              body: JSON.stringify({
                title: 'Test Retention Quiz',
                timeLimitMinutes: 30,
                type: 'RETENTION_TEST',
                questions: [
                  {
                    text: 'What is mitosis?',
                    options: ['Cell division', 'Cell growth', 'Cell death', 'Cell movement'],
                    correctAnswerIndex: 0
                  },
                  {
                    text: 'What is DNA?',
                    options: ['Protein', 'Lipid', 'Genetic material', 'Carbohydrate'],
                    correctAnswerIndex: 2
                  }
                ]
              })
            }
          );
          
          const retentionTestData = await retentionTestResponse.json();
          
          if (retentionTestData.success) {
            console.log('✅ Retention test created successfully');
            console.log('📊 Response:', retentionTestData.message);
          } else {
            console.log('❌ Retention test creation failed:', retentionTestData.message);
          }
          
        } catch (error: any) {
          console.log('❌ Retention test creation failed:', error.message);
        }
        
        // Test 3: Try to get retention test as student
        console.log('\n👩‍🎓 Test 3: Testing student access...');
        
        try {
          const studentLogin = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test.student@biolearn.com',
              password: 'password123'
            })
          });
          
          const studentLoginData = await studentLogin.json();
          
          if (studentLoginData.success) {
            const studentToken = studentLoginData.token;
            
            // Try to get class details as student
            const classDetails = await fetch(`${API_BASE}/classes/${testClass.id}`, {
              headers: { Authorization: `Bearer ${studentToken}` }
            });
            
            const classDetailsData = await classDetails.json();
            
            console.log('✅ Student can access class details');
            console.log('📊 Class has retention test:', !!classDetailsData.class?.retentionTest);
            
            if (classDetailsData.class?.retentionTest) {
              console.log('📝 Retention test details:', {
                title: classDetailsData.class.retentionTest.title,
                timeLimit: classDetailsData.class.retentionTest.timeLimitMinutes,
                questionCount: classDetailsData.class.retentionTest.questions?.length || 0
              });
            }
            
          } else {
            console.log('❌ Student login failed:', studentLoginData.message);
          }
          
        } catch (error: any) {
          console.log('❌ Student access test failed:', error.message);
        }
        
      } else {
        console.log('⚠️  No classes found - need to create test data first');
      }
      
    } else {
      console.log('❌ Teacher login failed:', teacherLoginData.message);
    }
    
  } catch (error: any) {
    console.log('❌ API test failed:', error.message);
    console.log('🔧 Make sure backend server is running on localhost:3001');
  }
}

// Run the test
testRetentionTestAPI();