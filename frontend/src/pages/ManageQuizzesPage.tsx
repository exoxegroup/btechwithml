
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassDetails, updateQuiz, getQuiz, getQuizWithAnswers, deleteQuiz, getRetentionTestWithAnswers, updateRetentionTest } from '../../services/api';
import { ClassDetails, Quiz } from '../../types';
import Header from '../../components/common/Header';
import { Spinner } from '../../components/common/Spinner';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import QuizEditor from '../../components/classroom/QuizEditor';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const ManageQuizzesPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usePretestQuestions, setUsePretestQuestions] = useState(false);
  const [pretestQuiz, setPretestQuiz] = useState<Quiz | null>(null);
  const [posttestQuiz, setPosttestQuiz] = useState<Quiz | null>(null);
  const [retentionTestQuiz, setRetentionTestQuiz] = useState<Quiz | null>(null);
  const [usePretestForRetention, setUsePretestForRetention] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!classId) return;
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const details = await getClassDetails(classId, token);
        
        if (details) {
          setClassDetails(details);
          
          // Try to fetch quizzes, handle 404 gracefully
          let pretest = null;
          let posttest = null;
          let retentionTest = null;
          
          try {
            pretest = await getQuizWithAnswers(classId, 'PRETEST', token);
          } catch (error: any) {
            if (error?.response?.status !== 404) {
              console.error('Error fetching pretest:', error);
            }
          }
          
          try {
            posttest = await getQuizWithAnswers(classId, 'POSTTEST', token);
          } catch (error: any) {
            if (error?.response?.status !== 404) {
              console.error('Error fetching posttest:', error);
            }
          }
          
          try {
            retentionTest = await getRetentionTestWithAnswers(classId, token);
          } catch (error: any) {
            if (error?.response?.status !== 404) {
              console.error('Error fetching retention test:', error);
            }
          }
          
          setPretestQuiz(pretest);
          setPosttestQuiz(posttest);
          setRetentionTestQuiz(retentionTest);
          
          // Show notification if no quizzes exist
          if (!pretest && !posttest && !retentionTest) {
            setTimeout(() => {
              toast.info('No quizzes created for this class yet. Please create Pre-test and Post-test quizzes below.', {
                duration: 5000,
                icon: 'ℹ️'
              });
            }, 500);
          }
          
          // Check if posttest questions match pretest questions to determine reuse
          if (posttest && pretest && 
              posttest.questions.length === pretest.questions.length &&
              posttest.questions.every((q: { text: string; options: string[] }, i: number) => 
                q.text === pretest.questions[i]?.text &&
                JSON.stringify(q.options) === JSON.stringify(pretest.questions[i]?.options))) {
            setUsePretestQuestions(true);
          }
          
          // Check if retention test questions match pretest questions to determine reuse
          if (retentionTest && pretest && 
              retentionTest.questions.length === pretest.questions.length &&
              retentionTest.questions.every((q: { text: string; options: string[] }, i: number) => 
                q.text === pretest.questions[i]?.text &&
                JSON.stringify(q.options) === JSON.stringify(pretest.questions[i]?.options))) {
            setUsePretestForRetention(true);
          }
        } else {
          toast.error('Class not found.');
        }
      } catch (err) {
        toast.error('Failed to load class details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [classId]);

  const handleSaveQuiz = async (quizType: 'pretest' | 'posttest', data: Quiz) => {
    if (!classId) return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Authentication required.');
      return;
    }
    try {
      const updatedQuiz = await updateQuiz(classId, {
        title: data.title,
        timeLimitMinutes: data.timeLimitMinutes,
        questions: data.questions,
        quizType: quizType.toUpperCase() as 'PRETEST' | 'POSTTEST'
      }, token);
      
      if (quizType === 'pretest') {
        setPretestQuiz(updatedQuiz);
      } else {
        setPosttestQuiz(updatedQuiz);
      }
      
      // If teacher edits post-test manually, the "reuse" flag should be turned off
      if(quizType === 'posttest') {
          handleReuseToggle(false);
      }
      toast.success(`${quizType === 'pretest' ? 'Pre-test' : 'Post-test'} saved successfully!`, {
        duration: 4000,
        icon: '📝',
        style: {
          background: '#10B981',
          color: '#fff',
        }
      });
    } catch (err) {
      toast.error(`Failed to save ${quizType}.`);
    }
  };

  const handleSaveRetentionTest = async (data: Quiz) => {
    if (!classId) return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Authentication required.');
      return;
    }
    try {
      const updatedQuiz = await updateRetentionTest(classId, {
        title: data.title,
        timeLimitMinutes: data.timeLimitMinutes,
        questions: data.questions
      }, token);
      
      setRetentionTestQuiz(updatedQuiz);
      toast.success('Retention Test saved successfully!', {
        duration: 4000,
        icon: '🧠',
        style: {
          background: '#10B981',
          color: '#fff',
        }
      });
    } catch (err) {
      toast.error('Failed to save Retention Test.');
    }
  };

  const handleReuseToggle = async (checked: boolean) => {
      if (!classId) return;
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required.');
        return;
      }
      setUsePretestQuestions(checked);
      
      if (checked && pretestQuiz) {
        // Copy pretest questions to posttest
        try {
          const updatedQuiz = await updateQuiz(classId, {
            title: pretestQuiz.title,
            timeLimitMinutes: pretestQuiz.timeLimitMinutes,
            questions: pretestQuiz.questions,
            quizType: 'POSTTEST'
          }, token);
          setPosttestQuiz(updatedQuiz);
          toast.success('Post-test questions copied from Pre-test successfully!', {
            duration: 3000,
            icon: '🔄',
            style: {
              background: '#10B981',
              color: '#fff',
            }
          });
        } catch (err) {
          toast.error('Failed to copy pretest questions to posttest.');
        }
      } else if (!checked && posttestQuiz) {
        // Keep posttest as is, just update the flag
        // This allows the teacher to edit posttest independently
        toast.info('Post-test questions can now be edited independently.', {
          duration: 3000,
          icon: '✏️'
        });
      }
  }

  const handleRetentionReuseToggle = async (checked: boolean) => {
      if (!classId) return;
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required.');
        return;
      }
      setUsePretestForRetention(checked);
      
      if (checked && pretestQuiz) {
        // Copy pretest questions to retention test
        try {
          const updatedQuiz = await updateRetentionTest(classId, {
            title: pretestQuiz.title,
            timeLimitMinutes: pretestQuiz.timeLimitMinutes,
            questions: pretestQuiz.questions
          }, token);
          setRetentionTestQuiz(updatedQuiz);
          toast.success('Retention Test questions copied from Pre-test successfully!', {
            duration: 3000,
            icon: '🔄',
            style: {
              background: '#10B981',
              color: '#fff',
            }
          });
        } catch (err) {
          toast.error('Failed to copy pretest questions to retention test.');
        }
      } else if (!checked && retentionTestQuiz) {
        // Keep retention test as is, just update the flag
        // This allows the teacher to edit retention test independently
        toast.info('Retention Test questions can now be edited independently.', {
          duration: 3000,
          icon: '✏️'
        });
      }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
  if (!classDetails) return null;

  const posttestData = usePretestQuestions 
    ? { ...classDetails.posttest, questions: classDetails.pretest.questions }
    : classDetails.posttest;

  return (
    <div className="min-h-screen bg-slate-100">
      <Header title={`Manage Quizzes: ${classDetails?.name || 'Loading...'}`} />
      <main className="container mx-auto p-8">
        <Link to="/teacher-dashboard" className="flex items-center gap-2 text-teal-600 font-semibold mb-6 hover:underline">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Quiz Creation Guide</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Select the radio button next to the options to specify the correct answer</li>
                  <li>To use Pre-test questions as Post-test questions, select "Use same questions as Pre-test" checkbox before saving pre-test questions</li>
                  <li>Save Pre-test questions before saving Post-test questions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <QuizEditor
            key={`pretest-${classId}`}
            editorTitle="Pre-Test Editor"
            quiz={pretestQuiz || {
              id: `temp-pretest-${classId}`,
              title: 'Pre-Test',
              timeLimitMinutes: 30,
              questions: []
            }}
            onSave={(data) => handleSaveQuiz('pretest', data)}
          />
          
          <div className="flex flex-col gap-4">
             <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Post-Test Editor</h3>
                <div className="flex items-center">
                    <input 
                        type="checkbox"
                        id="reuse-questions"
                        checked={usePretestQuestions}
                        onChange={(e) => handleReuseToggle(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="reuse-questions" className="ml-2 block text-sm font-medium text-slate-700">
                        Use same questions as Pre-test
                    </label>
                </div>
             </div>
             <QuizEditor
                key={`posttest-${classId}-${usePretestQuestions}`}
                editorTitle=""
                quiz={usePretestQuestions && pretestQuiz ? pretestQuiz : (posttestQuiz || {
                  id: `temp-posttest-${classId}`,
                  title: 'Post-Test',
                  timeLimitMinutes: 30,
                  questions: []
                })}
                onSave={(data) => handleSaveQuiz('posttest', data)}
                disabled={usePretestQuestions}
            />
          </div>
        </div>

        {/* Retention Test Section */}
        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Retention Test Editor</h2>
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="reuse-retention-questions"
                  checked={usePretestForRetention}
                  onChange={(e) => handleRetentionReuseToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="reuse-retention-questions" className="ml-2 block text-sm font-medium text-slate-700">
                  Use same questions as Pre-test
                </label>
              </div>
            </div>
            <QuizEditor
              key={`retention-${classId}-${usePretestForRetention}`}
              editorTitle=""
              quiz={usePretestForRetention && pretestQuiz ? pretestQuiz : (retentionTestQuiz || {
                id: `temp-retention-${classId}`,
                title: 'Retention Test',
                timeLimitMinutes: 30,
                questions: []
              })}
              onSave={(data) => handleSaveRetentionTest(data)}
              disabled={usePretestForRetention}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageQuizzesPage;
