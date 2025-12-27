import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion } from '../../types';

interface RetentionTestViewProps {
  quiz: Quiz;
  onComplete: (answers: (number | null)[]) => void;
  pretestCompleted?: boolean;
  posttestCompleted?: boolean;
}

const RetentionTestView: React.FC<RetentionTestViewProps> = ({ quiz, onComplete, pretestCompleted, posttestCompleted }) => {
  const questions = quiz?.questions || [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState((quiz?.timeLimitMinutes || 30) * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(answers);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete, answers]);

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
    // In a real app, we would submit `answers` to the backend here.
    alert('Retention test submitted! Thank you for participating in this study.');
    onComplete(answers);
  };

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

  const currentQuestion: QuizQuestion = questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8">
      <div className="w-full max-w-3xl">
        {(pretestCompleted || posttestCompleted) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
                <div className="flex gap-4">
                    {pretestCompleted && <span className="text-green-700 font-medium flex items-center">✓ Pre-test Completed</span>}
                    {posttestCompleted && <span className="text-green-700 font-medium flex items-center">✓ Post-test Completed</span>}
                </div>
                <div className="text-blue-700 text-sm">
                    Final Assessment Stage
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h1 className="text-3xl font-bold text-teal-600">{quiz.title}</h1>
          <div className="text-right">
            <div className="text-lg font-semibold text-slate-700">
              Time Left: {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-slate-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">{currentQuestion.text}</h2>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label key={index} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={answers[currentQuestionIndex] === index}
                  onChange={() => handleAnswerSelect(index)}
                  className="mr-3 h-4 w-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <span className="text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          <div>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestionIndex] === null}
                className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answers[currentQuestionIndex] === null}
                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetentionTestView;