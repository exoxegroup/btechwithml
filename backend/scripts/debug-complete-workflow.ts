/**
 * Detailed test to debug login and retention test workflow
 */

const API_BASE = 'http://localhost:3001/api';

async function debugLoginAndRetentionTest() {
  console.log('🔍 Debugging Login and Retention Test Workflow');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Login with teacher credentials
  console.log('1️⃣ Testing Teacher Login...');
  console.log('   Email: test.teacher@biolearn.com');
  console.log('   Password: password123');
  
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.teacher@biolearn.com',
        password: 'password123'
      })
    });

    console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ Teacher login successful');
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Role: ${data.user.role}`);
      
      // Store token for subsequent requests
      const teacherToken = data.token;
      
      // Test 2: Get teacher's classes
      console.log('');
      console.log('2️⃣ Getting Teacher Classes...');
      
      const classesResponse = await fetch(`${API_BASE}/classes`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        }
      });
      
      console.log(`   Status: ${classesResponse.status} ${classesResponse.statusText}`);
      
      if (classesResponse.ok) {
        const classes = await classesResponse.json();
        console.log(`✅ Found ${classes.length} classes`);
        
        if (classes.length > 0) {
          const testClass = classes[0];
          console.log(`   Class: ${testClass.name} (ID: ${testClass.id})`);
          
          // Test 3: Create retention test
          console.log('');
          console.log('3️⃣ Creating Retention Test...');
          
          const retentionTestResponse = await fetch(
            `${API_BASE}/quizzes/classes/${testClass.id}/quiz`,
            {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${teacherToken}`
              },
              body: JSON.stringify({
                title: 'Test Retention Quiz',
                timeLimitMinutes: 30,
                quizType: 'RETENTION_TEST',
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
          
          console.log(`   Status: ${retentionTestResponse.status} ${retentionTestResponse.statusText}`);
          
          if (retentionTestResponse.ok) {
            const retentionTestData = await retentionTestResponse.json();
            console.log('✅ Retention test created successfully');
            console.log(`   Quiz ID: ${retentionTestData.id}`);
            console.log(`   Title: ${retentionTestData.title}`);
            console.log(`   Type: ${retentionTestData.type}`);
            console.log(`   Questions: ${retentionTestData.questions.length}`);
            
            // Test 4: Student login and take retention test
            console.log('');
            console.log('4️⃣ Testing Student Login and Retention Test Access...');
            
            const studentLoginResponse = await fetch(`${API_BASE}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: 'test.student@biolearn.com',
                password: 'password123'
              })
            });
            
            if (studentLoginResponse.ok) {
              const studentData = await studentLoginResponse.json();
              const studentToken = studentData.token;
              console.log('✅ Student login successful');
              
              // Get retention test for student
              const studentQuizResponse = await fetch(
                `${API_BASE}/quizzes/classes/${testClass.id}/quiz?type=RETENTION_TEST`,
                {
                  method: 'GET',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${studentToken}`
                  }
                }
              );
              
              console.log(`   Student quiz access status: ${studentQuizResponse.status}`);
              
              if (studentQuizResponse.ok) {
                const studentQuiz = await studentQuizResponse.json();
                console.log('✅ Student can access retention test');
                console.log(`   Quiz title: ${studentQuiz.title}`);
                console.log(`   Time limit: ${studentQuiz.timeLimitMinutes} minutes`);
                console.log(`   Questions: ${studentQuiz.questions.length}`);
                
                // Test 5: Submit retention test
                console.log('');
                console.log('5️⃣ Submitting Retention Test Answers...');
                
                const submitResponse = await fetch(
                  `${API_BASE}/quizzes/classes/${testClass.id}/retention-test/submit`,
                  {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${studentToken}`
                    },
                    body: JSON.stringify({
                      quizId: retentionTestData.id,
                      answers: [0, 2] // Correct answers: mitosis=0, DNA=2
                    })
                  }
                );
                
                console.log(`   Submission status: ${submitResponse.status} ${submitResponse.statusText}`);
                
                if (submitResponse.ok) {
                  const result = await submitResponse.json();
                  console.log('✅ Retention test submitted successfully!');
                  console.log(`   Score: ${result.score}%`);
                  console.log(`   Correct: ${result.correctAnswers}/${result.totalQuestions}`);
                  
                  console.log('');
                  console.log('🎉 PHASE 2.4 VERIFICATION COMPLETE!');
                  console.log('All retention test functionality is working correctly.');
                  
                } else {
                  console.log('❌ Retention test submission failed');
                  const error = await submitResponse.text();
                  console.log(`   Error: ${error}`);
                }
              } else {
                console.log('❌ Student cannot access retention test');
                const error = await studentQuizResponse.text();
                console.log(`   Error: ${error}`);
              }
            } else {
              console.log('❌ Student login failed');
              const error = await studentLoginResponse.text();
              console.log(`   Error: ${error}`);
            }
          } else {
            console.log('❌ Retention test creation failed');
            const error = await retentionTestResponse.text();
            console.log(`   Error: ${error}`);
          }
        } else {
          console.log('❌ No classes found for teacher');
        }
      } else {
        console.log('❌ Cannot access teacher classes');
        const error = await classesResponse.text();
        console.log(`   Error: ${error}`);
      }
    } else {
      console.log('❌ Teacher login failed');
      const error = await loginResponse.text();
      console.log(`   Error: ${error}`);
    }
    
  } catch (error) {
    console.log('❌ Network or parsing error:', error.message);
  }
  
  console.log('');
  console.log('='.repeat(60));
}

// Run the test
debugLoginAndRetentionTest().catch(console.error);