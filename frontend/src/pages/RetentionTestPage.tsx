import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRetentionTest, submitRetentionTest } from '../../services/api';
import { Quiz } from '../../types';
import Header from '../../components/common/Header';
import { Spinner } from '../../components/common/Spinner';
import RetentionTestView from '../../components/classroom/RetentionTestView';
import { useAuth } from '../../hooks/useAuth';

const RetentionTestPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!classId) return;
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const quizData = await getRetentionTest(classId, token);
        if (quizData) {
          setQuiz(quizData);
        } else {
          setError('Retention test not found.');
        }
      } catch (err) {
        setError('Failed to load retention test.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [classId]);

  const handleComplete = async (answers: (number | null)[]) => {
    if (!classId || isSubmitting) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Filter out null answers and submit only valid answers
      const validAnswers = answers.filter(answer => answer !== null) as number[];
      const result = await submitRetentionTest(classId, validAnswers, token);
      
      if (result.score !== undefined) {
        alert(`Retention test completed! Your score: ${result.score}%`);
        navigate('/student-dashboard');
      } else {
        alert('Failed to submit retention test. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.message || '';
      if (errorMessage.includes('Quiz already taken') || errorMessage.includes('already submitted')) {
        alert('Retention test already submitted. Your score has been recorded.');
        navigate('/student-dashboard');
      } else {
        alert(errorMessage || 'Failed to submit retention test. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="Retention Test" />
      <main className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Retention Test Instructions</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This test helps us measure your knowledge retention after completing the course.</p>
                  <p className="mt-1">Please answer all questions to the best of your ability.</p>
                </div>
              </div>
            </div>
          </div>
          
          <RetentionTestView quiz={quiz} onComplete={handleComplete} />
        </div>
      </main>
    </div>
  );
};

export default RetentionTestPage;