
import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion } from '../../types';

interface PosttestViewProps {
  quiz: Quiz;
  onComplete: (answers: (number | null)[]) => void;
}

// This component is structurally identical to PretestView but separated for clarity
// in the file structure and potential future divergence in functionality.
const PosttestView: React.FC<PosttestViewProps> = ({ quiz, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions = quiz.questions || [];
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitMinutes * 60);
  const [hasStarted, setHasStarted] = useState(false);

  // If questions are hidden (sanitized by backend) or empty, check availability
  if (!questions.length) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            {quiz.title}
          </h2>
          {quiz.availableFrom ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <p className="text-lg text-amber-800 mb-2 font-medium">
                This test is not yet available.
              </p>
              <p className="text-slate-600">
                It will be available from:
              </p>
              <p className="text-xl font-mono font-bold text-slate-800 mt-2">
                {new Date(quiz.availableFrom).toLocaleString(undefined, {
                  dateStyle: 'full',
                  timeStyle: 'medium'
                })}
              </p>
            </div>
          ) : (
            <p className="text-slate-500">
              No questions are currently available for this test.
            </p>
          )}
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      onComplete(answers);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete, answers, hasStarted]);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handleSubmit = () => {
    // Submit `answers` to the backend via parent handler
    onComplete(answers);
  };

  const currentQuestion: QuizQuestion = questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!hasStarted) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl font-bold text-teal-600 mb-6">{quiz.title}</h1>
          
          <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Instructions</h3>
            <ul className="text-left space-y-3 text-slate-600">
              <li className="flex items-start">
                <span className="mr-2 text-teal-600">•</span>
                This test contains <span className="font-semibold text-slate-800 mx-1">{questions.length}</span> questions.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-600">•</span>
                You have <span className="font-semibold text-slate-800 mx-1">{quiz.timeLimitMinutes}</span> minutes to complete it.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-600">•</span>
                Once you start, the timer cannot be paused.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-600">•</span>
                Your answers will be submitted automatically when time runs out.
              </li>
            </ul>
          </div>

          <button 
            onClick={() => setHasStarted(true)}
            className="px-8 py-4 bg-teal-600 text-white text-lg font-bold rounded-xl hover:bg-teal-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h1 className="text-3xl font-bold text-teal-600">
            {quiz.title.toLowerCase().includes('pre') ? 'Post Test' : quiz.title}
          </h1>
          <div className="text-2xl font-mono bg-red-100 text-red-600 px-4 py-2 rounded-lg">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
        <div className="mb-6">
          <p className="text-slate-500 mb-2">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
          <h2 className="text-2xl font-semibold text-slate-800">{currentQuestion.text}</h2>
        </div>
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`block w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                answers[currentQuestionIndex] === index
                  ? 'bg-teal-100 border-teal-500 ring-2 ring-teal-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              <span className="font-semibold">{option}</span>
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button onClick={handleNext} className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700">
              Next Question
            </button>
          ) : (
            <button onClick={handleSubmit} className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
              Submit Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosttestView;
