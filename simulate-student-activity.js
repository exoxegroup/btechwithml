
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const CLASS_ID = 'cmkeew2t50002qzlt4tn9pn9g';

// Teacher credentials
const TEACHER_EMAIL = 'teacher_test@school.edu';
const TEACHER_PASSWORD = 'SecureTeach123!';

// Student profiles
const STUDENTS = [
  { email: 'student1_test@school.edu', password: 'LearnStudent456!', type: 'HIGH' },  // Alice
  { email: 'student2_test@school.edu', password: 'StudySmart789!', type: 'HIGH' },  // Bob
  { email: 'student3_test@school.edu', password: 'BioLearn321!', type: 'HIGH' },  // Carol
  { email: 'student4_test@school.edu', password: 'SciencePass654!', type: 'MID' },   // David
  { email: 'student5_test@school.edu', password: 'TestUser987!', type: 'MID' },   // Eva
  { email: 'student6_test@school.edu', password: 'BasicAccess123!', type: 'LOW' }    // Frank
];

// Target scores (approximate percentage)
const SCORES = {
  HIGH: { pre: 100, post: 100, ret: 100 },
  MID: { pre: 66, post: 75, ret: 80 },
  LOW: { pre: 33, post: 45, ret: 40 }
};

let teacherToken = '';
let quizzes = {
  PRETEST: null,
  POSTTEST: null,
  RETENTION_TEST: null
};

async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.message);
    throw error;
  }
}

async function getQuizWithAnswers(type) {
  try {
    // Need to find the quiz ID first or use an endpoint that returns it by type/class
    // The controller has `getQuizWithAnswers` at /classes/:classId/quiz/answers
    // But that might return all quizzes or specific one? 
    // Let's check the route: GET /classes/:classId/quiz/answers
    // It likely returns the quiz based on query param or returns all?
    // Let's try to fetch all or assume one exists.
    // Actually, `getQuizWithAnswers` usually takes a query param for type?
    // Looking at controller code (not shown fully), usually getQuiz takes type in query.
    
    // Let's try to CREATE the quizzes first to be sure they exist and we know the answers.
    // Or update them.
    
    // Create 10 questions for better score granularity
    const questions = Array.from({ length: 10 }, (_, i) => ({
      text: `Question ${i + 1} for ${type}`,
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: i % 4 // Pattern: A, B, C, D, A, B...
    }));

    console.log(`Creating/Updating ${type} with ${questions.length} questions...`);
    const response = await axios.put(
      `${BASE_URL}/classes/${CLASS_ID}/quiz`,
      {
        title: `${type} for Phase 4`,
        timeLimitMinutes: 30,
        quizType: type,
        questions: questions,
        availableFrom: new Date(Date.now() - 86400000).toISOString() // Yesterday
      },
      { headers: { Authorization: `Bearer ${teacherToken}` } }
    );
    
    return response.data; // Should contain the quiz with questions and answers
  } catch (error) {
    console.error(`Failed to get/create quiz ${type}:`, error.message);
    if (error.response) console.error(error.response.data);
    throw error;
  }
}

function generateAnswers(questions, targetScore) {
  // targetScore is 0-100
  const totalQuestions = questions.length;
  const targetCorrect = Math.round((targetScore / 100) * totalQuestions);
  
  return questions.map((q, index) => {
    if (index < targetCorrect) {
      return q.correctAnswerIndex;
    } else {
      // Return a wrong answer
      return (q.correctAnswerIndex + 1) % q.options.length;
    }
  });
}

async function submitQuizForStudent(studentToken, quizType, answers) {
  try {
    await axios.post(
      `${BASE_URL}/classes/${CLASS_ID}/quiz/submit`,
      {
        classId: CLASS_ID,
        quizType: quizType,
        answers: answers
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    // process.stdout.write('.');
  } catch (error) {
    // Ignore "Quiz already taken" if we are re-running
    if (error.response && error.response.data && error.response.data.message === 'Quiz already taken') {
      // console.log(' (Already taken)');
      return;
    }
    console.error(`Failed to submit ${quizType}:`, error.message);
    if (error.response) console.error(error.response.data);
  }
}

async function runSimulation() {
  console.log('🚀 Starting Student Activity Simulation...');

  // 1. Teacher Login
  console.log('👨‍🏫 Logging in Teacher...');
  teacherToken = await login(TEACHER_EMAIL, TEACHER_PASSWORD);

  // 2. Ensure Quizzes Exist and Get Answers
  console.log('📝 Setting up Quizzes...');
  quizzes.PRETEST = await getQuizWithAnswers('PRETEST');
  quizzes.POSTTEST = await getQuizWithAnswers('POSTTEST');
  quizzes.RETENTION_TEST = await getQuizWithAnswers('RETENTION_TEST');

  // 3. Simulate Student Activity
  console.log('\n🎓 Simulating Student Submissions...');
  
  for (const student of STUDENTS) {
    const name = student.email.split('@')[0];
    console.log(`\nProcessing ${name} (${student.type})...`);
    
    const studentToken = await login(student.email, student.password);
    const scores = SCORES[student.type];

    // Pretest
    const preAnswers = generateAnswers(quizzes.PRETEST.questions, scores.pre);
    await submitQuizForStudent(studentToken, 'PRETEST', preAnswers);
    console.log(`  ✅ Pretest submitted (Target: ${scores.pre}%)`);

    // Posttest
    const postAnswers = generateAnswers(quizzes.POSTTEST.questions, scores.post);
    await submitQuizForStudent(studentToken, 'POSTTEST', postAnswers);
    console.log(`  ✅ Posttest submitted (Target: ${scores.post}%)`);

    // Retention Test
    const retAnswers = generateAnswers(quizzes.RETENTION_TEST.questions, scores.ret);
    await submitQuizForStudent(studentToken, 'RETENTION_TEST', retAnswers);
    console.log(`  ✅ Retention Test submitted (Target: ${scores.ret}%)`);
  }

  console.log('\n✅ Simulation Complete!');
}

runSimulation().catch(console.error);
