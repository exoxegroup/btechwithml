const config = {
  baseUrl: 'http://localhost:3001'
};

async function debugQuizSubmission() {
  console.log('🧪 Debugging Quiz Submission');
  console.log('=====================================');

  // First, let's authenticate a student
  console.log('Authenticating student...');
  const loginResponse = await fetch(`${config.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student1_test@school.edu',
      password: 'LearnStudent456!'
    })
  });

  if (!loginResponse.ok) {
    console.error('Login failed:', loginResponse.status);
    return;
  }

  const loginData = await loginResponse.json();
  const studentToken = loginData.token;
  console.log('Student token:', studentToken.substring(0, 50) + '...');

  // Decode the token to see what's in it
  const tokenParts = studentToken.split('.');
  const payload = JSON.parse(atob(tokenParts[1]));
  console.log('Token payload:', payload);

  // Test getting a quiz first
  console.log('\nTesting quiz retrieval...');
  const quizResponse = await fetch(`${config.baseUrl}/api/classes/cmj69da1b000myh994f0q812i/quiz?type=PRETEST`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (quizResponse.ok) {
    const quizData = await quizResponse.json();
    console.log('Quiz retrieved successfully:', quizData.questions.length, 'questions');
  } else {
    console.error('Quiz retrieval failed:', quizResponse.status, await quizResponse.text());
  }

  // Test submitting quiz
  console.log('\nTesting quiz submission...');
  const submitResponse = await fetch(`${config.baseUrl}/api/classes/cmj69da1b000myh994f0q812i/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      classId: 'cmj69da1b000myh994f0q812i',
      answers: [0, 1, 0], // Sample answers
      quizType: 'PRETEST'
    })
  });

  if (submitResponse.ok) {
    const result = await submitResponse.json();
    console.log('Quiz submitted successfully:', result);
  } else {
    console.error('Quiz submission failed:', submitResponse.status, await submitResponse.text());
  }
}

debugQuizSubmission().catch(console.error);