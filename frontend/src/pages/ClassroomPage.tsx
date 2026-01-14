import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { io, Socket } from 'socket.io-client';
import { getClassDetails, submitPretest, getQuiz, submitQuiz } from '../../services/api';
import { ClassDetails, ClassroomStatus, EnrolledStudent, Quiz } from '../../types';
import Header from '../../components/common/Header';
import { Spinner } from '../../components/common/Spinner';
import CountdownTimer from '../components/common/CountdownTimer';
import { Play, Square, Users, Redo, CheckCircle, Clock, AlertCircle, LayoutDashboard } from 'lucide-react';
import JitsiVideo from '../../components/classroom/JitsiVideo';
import toast from 'react-hot-toast';

// Sub-components for different classroom views
import PretestView from '../../components/classroom/PretestView';
import PosttestView from '../../components/classroom/PosttestView';
import MainSessionView from '../../components/classroom/MainSessionView';
import GroupSessionView from '../../components/classroom/GroupSessionView';
import TeacherGroupMonitorView from '../../components/classroom/TeacherGroupMonitorView';
import RetentionTestView from '../../components/classroom/RetentionTestView';

const ClassroomPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [pretestQuiz, setPretestQuiz] = useState<Quiz | null>(null);
  const [posttestQuiz, setPosttestQuiz] = useState<Quiz | null>(null);
  const [retentionQuiz, setRetentionQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classStatus, setClassStatus] = useState<ClassroomStatus>('WAITING_ROOM');
  const [student, setStudent] = useState<EnrolledStudent | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [takingRetention, setTakingRetention] = useState(false);
  const [timeTrigger, setTimeTrigger] = useState(Date.now());

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!classId || !user) {
        setError('Invalid class or user.');
        setLoading(false);
        return;
      }
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const [details, pretest, posttest] = await Promise.all([
            getClassDetails(classId, token),
            getQuiz(classId, 'PRETEST', token).catch(err => {
                console.log('Pretest not found or error:', err);
                return null;
            }),
            getQuiz(classId, 'POSTTEST', token).catch(err => {
                console.log('Posttest not found or error:', err);
                return null;
            })
          ]);
          
          setClassDetails(details);
          setPretestQuiz(pretest);
          setPosttestQuiz(posttest);
          // Retention quiz is usually part of details, but we can rely on it being there or fetch if needed
          if (details.retentionTest) {
             setRetentionQuiz(details.retentionTest);
          }

          // Normalize backend status to frontend ClassroomStatus
          let normalizedStatus = details.status as string;
          if (normalizedStatus === 'ACTIVE') normalizedStatus = 'WAITING_ROOM';
          if (normalizedStatus === 'COMPLETED') normalizedStatus = 'ENDED';
          
          if (user && user.role === 'STUDENT') {
            const currentStudent = details.students.find((s: EnrolledStudent) => s.id === user.id);
            setStudent(currentStudent || null);

            // Logic:
            // 1. If student hasn't taken pretest, enforce PRETEST regardless of class status (unless class is ENDED/POSTTEST?). 
            //    Actually, if class is ongoing, they must take pretest first.
            const hasTakenPretest = currentStudent?.pretestStatus === 'TAKEN' || (currentStudent?.pretestScore !== null);
            const hasTakenPosttest = currentStudent?.posttestScore !== null;
            
            if (!hasTakenPretest) {
               setClassStatus('PRETEST');
            } else if (normalizedStatus === 'PRETEST' && hasTakenPretest) {
               // Prevent showing Pretest again if taken
               setClassStatus('WAITING_ROOM');
            } else {
              // Otherwise, follow the class status from the backend
              setClassStatus((normalizedStatus as ClassroomStatus) || 'WAITING_ROOM');
            }
          } else {
             setClassStatus((normalizedStatus as ClassroomStatus) || 'WAITING_ROOM');
          }
        } catch (error) {
          console.error('Failed to fetch class details:', error);
          setError('Failed to load class details.');
        } finally {
          setLoading(false);
        }
      } else {
        setError('Authentication required.');
        setLoading(false);
      }
    };
    fetchClassDetails();
    // Polling/sockets will be added in Phase 6 for real-time updates.
  }, [classId, user, timeTrigger]);

  // Socket.io connection and event handling
  useEffect(() => {
    if (!classId || !user) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required.');
      return;
    }

    // Initialize socket connection
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const newSocket = io(backendUrl, {
      auth: {
        token
      }
    });

    newSocket.on('connect', () => {
      // Join the class room
      newSocket.emit('join_room', { classId, userId: user?.id });
    });

    newSocket.on('class:state-changed', async (data: { status: ClassroomStatus; message: string }) => {
      setClassStatus(data.status);
      
      // Refresh class details when entering Group Session or Post-test/Ended
      // This ensures we have the latest group assignments or classEndedAt timestamp
      if (['GROUP_SESSION', 'POSTTEST', 'ENDED'].includes(data.status)) {
          console.log(`Status changed to ${data.status}, refreshing class details...`);
          const token = localStorage.getItem('authToken');
          if (token && classId) {
             try {
                 const updatedDetails = await getClassDetails(classId, token);
                 setClassDetails(updatedDetails);
                 
                 if (user && user.role === 'STUDENT') {
                     const currentStudent = updatedDetails.students.find((s: EnrolledStudent) => s.id === user.id);
                     if (currentStudent) {
                         setStudent(currentStudent);
                     }
                 }
             } catch (err) {
                 console.error('Failed to refresh class details on status change:', err);
             }
          }
      }
    });

    newSocket.on('teacher:error', (data: { error: string }) => {
      console.error('Teacher action error:', data.error);
      setError(data.error);
    });

    newSocket.on('users:online', (data: { onlineUsers: string[] }) => {
      setOnlineUsers(data.onlineUsers);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [classId, user]);

  const handlePretestComplete = async (answers: (number | null)[]) => {
    const token = localStorage.getItem('authToken');
    if (token && classId) {
      try {
        // Filter out null answers and convert to numbers
        const validAnswers = answers.filter(answer => answer !== null) as number[];
        await submitQuiz(classId, validAnswers, 'PRETEST', token);
        // Refetch class details to update status and move to waiting room
        const updatedDetails = await getClassDetails(classId, token);
        setClassDetails(updatedDetails);
        setClassStatus('WAITING_ROOM');
      } catch (error) {
        console.error('Failed to submit pretest:', error);
        setError('Failed to submit pretest. Please try again.');
      }
    }
  };

  const handlePosttestComplete = async (answers: (number | null)[]) => {
    const token = localStorage.getItem('authToken');
    if (token && classId) {
      try {
        // Filter out null answers and convert to numbers
        const validAnswers = answers.filter(answer => answer !== null) as number[];
        
        if (validAnswers.length === 0) {
            toast.error('Please answer at least one question');
            return;
        }

        await submitQuiz(classId, validAnswers, 'POSTTEST', token);
        
        // Refetch class details to update student scores and status
        const updatedDetails = await getClassDetails(classId, token);
        setClassDetails(updatedDetails);
        
        // Update the current student state to reflect the new score
        if (user && user.role === 'STUDENT') {
             const currentStudent = updatedDetails.students.find((s: EnrolledStudent) => s.id === user.id);
             setStudent(currentStudent || null);
        }

        setClassStatus('ENDED');
        toast.success('Post-test submitted successfully!');
      } catch (error) {
        console.error('Failed to submit posttest:', error);
        toast.error('Failed to submit posttest. Please try again.');
        setError('Failed to submit posttest. Please try again.');
      }
    }
  };

  const handleRetentionComplete = async (answers: (number | null)[]) => {
    if (submittingRetention) return;
    
    const token = localStorage.getItem('authToken');
    if (token && classId) {
      try {
        setSubmittingRetention(true);
        const validAnswers = answers.filter(answer => answer !== null) as number[];
        
        if (validAnswers.length === 0) {
            toast.error('Please answer at least one question');
            setSubmittingRetention(false);
            return;
        }

        await submitQuiz(classId, validAnswers, 'RETENTION_TEST', token);
        
        // Refetch details to update score
        const updatedDetails = await getClassDetails(classId, token);
        setClassDetails(updatedDetails);
        if (user && user.role === 'STUDENT') {
             const currentStudent = updatedDetails.students.find((s: EnrolledStudent) => s.id === user.id);
             setStudent(currentStudent || null);
        }

        setTakingRetention(false);
        toast.success('Retention test submitted successfully!');
      } catch (error) {
        console.error('Failed to submit retention test:', error);
        toast.error('Failed to submit retention test. Please try again.');
      } finally {
        setSubmittingRetention(false);
      }
    }
  };

  // Handle teacher controls with Socket.io
  const handleTeacherControl = (newStatus: ClassroomStatus) => {
    if (!socket || !classId || !user || user.role !== 'TEACHER') {
      console.error('Socket not available or user is not a teacher');
      return;
    }

    console.log(`Teacher action: Set status to ${newStatus}`);
    
    switch (newStatus) {
      case 'MAIN_SESSION':
        socket.emit('teacher:start-class', { classId });
        break;
      case 'GROUP_SESSION':
        socket.emit('teacher:activate-groups', { classId });
        break;
      case 'POSTTEST':
        socket.emit('teacher:end-class', { classId });
        break;
      default:
        console.error('Invalid status for teacher control:', newStatus);
    }
  };

  const EndClassModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onConfirm();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">End Class</h3>
          <p className="text-slate-600 mb-4">Are you sure you want to end the class? The post-test will become available to students.</p>
          <p className="text-sm text-slate-500 mb-6">Note: Retention test availability is now configured in the Class Settings.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">End Class</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TeacherControls: React.FC = () => {
    const [showEndClassModal, setShowEndClassModal] = useState(false);

    return (
      <>
        <div className="bg-white p-3 rounded-lg shadow-md flex items-center gap-2">
          <p className="font-semibold text-slate-700 mr-2">Class Control:</p>
          <button onClick={() => handleTeacherControl('MAIN_SESSION')} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"><Play size={16}/> Start Class</button>
          <button onClick={() => handleTeacherControl('GROUP_SESSION')} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Users size={16}/> Activate Groups</button>
          <button onClick={() => handleTeacherControl('MAIN_SESSION')} className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"><Redo size={16}/> End Groups</button>
          <button onClick={() => setShowEndClassModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"><Square size={16}/> End Class</button>
        </div>
        <EndClassModal 
          isOpen={showEndClassModal} 
          onClose={() => setShowEndClassModal(false)} 
          onConfirm={() => {
            handleTeacherControl('POSTTEST');
            setShowEndClassModal(false);
          }} 
        />
      </>
    );
  };

  const StudentClassSummary: React.FC = () => {
    if (!student || !classDetails) return null;

    const isRetentionAvailable = () => {
        // Must have completed post-test
        if (student.posttestScore === null) return false;
        
        // If no delay set, available immediately
        if (!classDetails.retentionTestDelayMinutes) return true;

        // If posttestCompletedAt exists, use it
        if (student.posttestCompletedAt) {
            const completedAt = new Date(student.posttestCompletedAt).getTime();
            const now = new Date().getTime();
            const delayMs = classDetails.retentionTestDelayMinutes * 60 * 1000;
            return now >= completedAt + delayMs;
        }

        // Fallback to classEndedAt
        if (classDetails.classEndedAt) {
            const endedAt = new Date(classDetails.classEndedAt).getTime();
            const now = new Date().getTime();
            const delayMs = classDetails.retentionTestDelayMinutes * 60 * 1000;
            return now >= endedAt + delayMs;
        }

        return false;
    };

    const getRetentionAvailabilityTime = () => {
        if (!classDetails.retentionTestDelayMinutes) return null;
        
        if (student.posttestCompletedAt) {
            const completedAt = new Date(student.posttestCompletedAt).getTime();
            const delayMs = classDetails.retentionTestDelayMinutes * 60 * 1000;
            return new Date(completedAt + delayMs);
        }

        if (classDetails.classEndedAt) {
            const endedAt = new Date(classDetails.classEndedAt).getTime();
            const delayMs = classDetails.retentionTestDelayMinutes * 60 * 1000;
            return new Date(endedAt + delayMs);
        }
        return null;
    };

    const retentionAvailable = isRetentionAvailable();
    const retentionDate = getRetentionAvailabilityTime();

    // Auto-check for retention availability
    useEffect(() => {
        if (!retentionAvailable && retentionDate) {
            const interval = setInterval(() => {
                const now = new Date();
                if (now >= retentionDate) {
                    // Retention just became available
                    // We can force a re-render or just let the user see the button (if we used state for retentionAvailable)
                    // Since retentionAvailable is derived, we need to trigger a re-render. 
                    // However, React might not re-render just because time passed unless state changed.
                    // Let's use a local ticker.
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [retentionAvailable, retentionDate]);

    // Force re-render every minute to update availability status if close? 
    // Or just use a simple "now" state.
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000); // Update every second to catch the exact moment
        return () => clearInterval(timer);
    }, []);

    // Auto-route if on this page and retention becomes available?
    useEffect(() => {
        if (retentionAvailable && !student.retentionScore && !takingRetention) {
            // Optional: Auto-start? The requirement says "Route student to take retention test when countdown timer expires"
            // If we are strictly following "Route student", we should setTakingRetention(true).
            // But let's be careful not to interrupt if they are reading materials.
            // However, the requirement is specific. Let's do it.
            setTakingRetention(true);
            toast.success("Retention test is now available. You have been redirected.");
        }
    }, [retentionAvailable, student.retentionScore, takingRetention]);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Class Session Completed</h2>
                <p className="text-slate-600">
                    Thank you for participating in {classDetails.name}. You can view your performance below.
                </p>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Pre-Test</h3>
                    <div className="text-4xl font-bold text-teal-600 mb-2">
                        {student.pretestScore !== null ? `${student.pretestScore}%` : 'N/A'}
                    </div>
                    {student.pretestScore !== null ? (
                        <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle size={16} className="mr-1" /> Completed
                        </div>
                    ) : (
                        <span className="text-slate-400 text-sm">Not taken</span>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Post-Test</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                        {student.posttestScore !== null ? `${student.posttestScore}%` : 'N/A'}
                    </div>
                    {student.posttestScore !== null ? (
                        <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle size={16} className="mr-1" /> Completed
                        </div>
                    ) : (
                        <span className="text-slate-400 text-sm">Not taken</span>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Retention Test</h3>
                    {student.retentionScore !== null ? (
                        <>
                            <div className="text-4xl font-bold text-purple-600 mb-2">
                                {student.retentionScore}%
                            </div>
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle size={16} className="mr-1" /> Completed
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center">
                            {retentionAvailable ? (
                                <button 
                                    onClick={() => setTakingRetention(true)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                >
                                    Take Test Now
                                </button>
                            ) : (
                                retentionDate ? (
                                    <CountdownTimer targetDate={retentionDate} />
                                ) : (
                                    <div className="text-center">
                                        <Clock size={32} className="text-orange-400 mb-2 mx-auto" />
                                        <p className="text-sm text-slate-500">Availability Pending</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Class Materials/Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Class Materials</h3>
                {classDetails.materials && classDetails.materials.length > 0 ? (
                    <ul className="space-y-3">
                        {classDetails.materials.map((material: any, idx: number) => (
                            <li key={idx} className="flex items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <span className="mr-3 p-2 bg-blue-100 text-blue-600 rounded-full">
                                    {material.type === 'YOUTUBE' ? <Play size={16} /> : <Redo size={16} />} 
                                </span>
                                <div>
                                    <p className="font-medium text-slate-800">{material.title}</p>
                                    <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        View Material
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 italic">No materials available for this class.</p>
                )}
            </div>
        </div>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="flex-grow flex items-center justify-center"><Spinner size="lg" /></div>;
    if (error) return <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>;
    if (!classDetails) return <div className="flex-grow flex items-center justify-center">Class data is unavailable.</div>;

    // Student View
    if (user && user.role === 'STUDENT') {
      // Safety check: If status is PRETEST but student hasn't taken it, force render Pretest
      // This handles the case where setClassStatus('PRETEST') was called but render might lag?
      // Actually, relies on classStatus state.
      
      // Strict render logic based on status
      if (classStatus === 'PRETEST') {
          return pretestQuiz ? 
            <PretestView quiz={pretestQuiz} onComplete={handlePretestComplete} /> : 
            <div className="text-center p-8">
              <h2 className="text-3xl font-bold">Pre-test not available</h2>
              <p className="text-slate-600 mt-2">Please contact your teacher.</p>
            </div>;
      }

      switch (classStatus) {
        case 'WAITING_ROOM':
          return <div className="text-center p-8">
            <h2 className="text-3xl font-bold">Welcome, {user.name}!</h2>
            <p className="text-slate-600 mt-2">The class will begin shortly. Please wait for the teacher to start.</p>
          </div>;
        case 'MAIN_SESSION':
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Main Session</h2>
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showVideo ? 'Hide Video' : 'Show Video'}
                </button>
              </div>
              <p className="text-slate-600">Welcome to the main session. The teacher will guide you through the lesson.</p>
              
              {showVideo && (
                <div className="bg-slate-900 rounded-lg overflow-hidden">
                  <JitsiVideo
                    roomName={`bioclass-${classId}`}
                    displayName={user?.name || 'Anonymous'}
                    isTeacher={user?.role === 'TEACHER'}
                  />
                </div>
              )}
              
              <div className="bg-slate-100 rounded-lg p-8 text-center">
                <p className="text-slate-500">Main session content will appear here</p>
              </div>
            </div>
          );
        case 'GROUP_SESSION':
          return <GroupSessionView classDetails={classDetails} student={student!} />;
        case 'POSTTEST':
          // Check if student already took posttest
          if (student?.posttestScore !== null) {
              if (takingRetention && retentionQuiz) {
                  return <RetentionTestView 
                            quiz={retentionQuiz} 
                            onComplete={handleRetentionComplete} 
                            pretestCompleted={student.pretestScore !== null}
                            posttestCompleted={student.posttestScore !== null}
                        />;
              }
              return <StudentClassSummary />;
          }

          // Check for Post Test Delay
          if (classDetails?.classEndedAt && classDetails?.postTestDelayMinutes) {
             const endedAt = new Date(classDetails.classEndedAt).getTime();
             const delayMs = classDetails.postTestDelayMinutes * 60 * 1000;
             const unlockTime = endedAt + delayMs;
             const now = Date.now();
             
             if (now < unlockTime) {
                 return (
                     <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8">
                         <div className="text-center max-w-md mx-auto">
                             <div className="mb-6 bg-amber-50 text-amber-600 p-4 rounded-full inline-flex">
                                <Clock size={48} />
                             </div>
                             <h2 className="text-2xl font-bold text-slate-800 mb-2">Post-Test Locked</h2>
                             <p className="text-slate-600 mb-8">
                                The class has ended, but the post-test is not yet available. 
                                Please wait until the timer expires.
                             </p>
                             
                             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                                <CountdownTimer 
                                    targetDate={new Date(unlockTime)} 
                                    onComplete={() => setTimeTrigger(Date.now())} 
                                />
                             </div>
                             
                             <p className="text-sm text-slate-500">
                                You can stay on this page or return later. 
                                The test will start automatically when available.
                             </p>
                         </div>
                     </div>
                 );
             }
          }

          return posttestQuiz ? 
            <PosttestView quiz={posttestQuiz} onComplete={handlePosttestComplete} /> : 
            <div className="text-center p-8">
              <h2 className="text-3xl font-bold">Post-test not available</h2>
              <p className="text-slate-600 mt-2">Please contact your teacher.</p>
            </div>;
        case 'ENDED':
            // If student hasn't taken post-test, they should still be able to take it (subject to delay)
            if (student?.posttestScore === null) {
                // Check for Post Test Delay logic (same as POSTTEST case)
                if (classDetails?.classEndedAt && classDetails?.postTestDelayMinutes) {
                    const endedAt = new Date(classDetails.classEndedAt).getTime();
                    const delayMs = classDetails.postTestDelayMinutes * 60 * 1000;
                    const unlockTime = endedAt + delayMs;
                    const now = Date.now();
                    
                    if (now < unlockTime) {
                        return (
                            <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8">
                                <div className="text-center max-w-md mx-auto">
                                    <div className="mb-6 bg-amber-50 text-amber-600 p-4 rounded-full inline-flex">
                                        <Clock size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Post-Test Locked</h2>
                                    <p className="text-slate-600 mb-8">
                                        The class has ended, but the post-test is not yet available. 
                                        Please wait until the timer expires.
                                    </p>
                                    
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                                        <CountdownTimer 
                                            targetDate={new Date(unlockTime)} 
                                            onComplete={() => setTimeTrigger(Date.now())} 
                                        />
                                    </div>
                                    
                                    <p className="text-sm text-slate-500">
                                        You can stay on this page or return later. 
                                        The test will start automatically when available.
                                    </p>
                                </div>
                            </div>
                        );
                    }
                }

                return posttestQuiz ? 
                    <PosttestView quiz={posttestQuiz} onComplete={handlePosttestComplete} /> : 
                    <div className="text-center p-8">
                        <h2 className="text-3xl font-bold">Post-test not available</h2>
                        <p className="text-slate-600 mt-2">Please contact your teacher.</p>
                    </div>;
            }

            if (takingRetention && retentionQuiz) {
                return <RetentionTestView 
                            quiz={retentionQuiz} 
                            onComplete={handleRetentionComplete} 
                            pretestCompleted={student.pretestScore !== null}
                            posttestCompleted={student.posttestScore !== null}
                        />;
            }
            return <StudentClassSummary />;
        default:
          return <div>Unknown class state.</div>;
      }
    }

    // Teacher View
    if (user && user.role === 'TEACHER') {
      switch(classStatus) {
        case 'GROUP_SESSION':
            return <TeacherGroupMonitorView classDetails={classDetails} />;
        default: // Covers WAITING, MAIN_SESSION, POSTTEST, ENDED
            return (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Main Session</h2>
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showVideo ? 'Hide Video' : 'Show Video'}
                  </button>
                </div>
                <p className="text-slate-600">Welcome to the main session. You are now in control of the lesson.</p>
                
                {showVideo && (
                  <div className="bg-slate-900 rounded-lg overflow-hidden">
                    <JitsiVideo
                      roomName={`bioclass-${classId}`}
                      displayName={user?.name || 'Teacher'}
                      isTeacher={true}
                    />
                  </div>
                )}
                
                <div className="bg-slate-100 rounded-lg p-8 text-center">
                  <p className="text-slate-500">Main session content will appear here</p>
                </div>
              </div>
            );
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header title={classDetails?.name || 'Classroom'} />
      {user && user.role === 'TEACHER' && 
        <div className="container mx-auto p-4 flex justify-between items-center">
          <Link to="/teacher-dashboard" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md">
             <LayoutDashboard size={18} />
             Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 text-slate-600">
              <Users className="w-4 h-4" />
              <span>{onlineUsers.length} online</span>
            </div>
            <TeacherControls />
          </div>
        </div>
      }
      <main className="container mx-auto p-4 pt-0 flex-grow flex flex-col">
          {renderContent()}
      </main>
    </div>
  );
};

export default ClassroomPage;