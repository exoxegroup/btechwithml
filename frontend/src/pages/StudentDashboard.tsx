
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStudentClasses, enrollInClass, getClassDetails } from '../../services/api';
import { ClassSummary, Material } from '../../types';
import Header from '../../components/common/Header';
import { Spinner } from '../../components/common/Spinner';
import { LogIn, User, FileText, Youtube, Download, ExternalLink, Timer, CheckCircle, XCircle } from 'lucide-react';

const CountdownTimer: React.FC<{ targetDate: number; onComplete: () => void }> = ({ targetDate, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const newTimeLeft = targetDate - Date.now();
            if (newTimeLeft <= 0) {
                clearInterval(interval);
                onComplete();
            } else {
                setTimeLeft(newTimeLeft);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate, onComplete]);

    if (timeLeft <= 0) return null;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return (
        <div className="flex items-center gap-2 text-amber-600 font-mono font-bold bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
            <Timer size={16} />
            <span>{days}d {hours}h {minutes}m {seconds}s</span>
        </div>
    );
};

const ClassCard: React.FC<{ classInfo: ClassSummary; currentUserId: string }> = ({ classInfo, currentUserId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [classDetails, setClassDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStudent, setCurrentStudent] = useState<any>(null);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('No access token found');
            setLoading(false);
            return;
        }

        try {
            const details = await getClassDetails(classInfo.id, token);
            setClassDetails(details);
            
            // Find current student in the class
            if (currentUserId && details.students) {
                const student = details.students.find((s: any) => s.id === currentUserId);
                setCurrentStudent(student);
            }
        } catch (err) {
            setError('Failed to load class content');
            console.error('Error fetching class details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Allow all students to enter to take pre-test or wait for grouping
    const canEnter = true;

    return (
        <>
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
                <div className="p-6 flex-grow">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{classInfo.name}</h3>
                    <div className="flex items-center text-slate-500 mt-4 gap-4">
                        <span className="flex items-center gap-2"><User size={16} />{classInfo.teacherName}</span>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <Link to={`/classroom/${classInfo.id}`} className="text-center flex justify-center items-center bg-teal-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-teal-700 transition-colors text-sm">
                            Enter Classroom
                        </Link>
                        <button 
                            onClick={handleOpenModal}
                            className="text-center flex justify-center items-center bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            Content
                        </button>
                    </div>
                    {(!classInfo.groupNumber && classInfo.groupNumber !== 0) && (
                        <p className="text-xs text-orange-600 text-center font-medium">
                            Enter to take pre-test and wait for group assignment
                        </p>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {classDetails?.name || 'Class Content'}
                            </h2>
                            <button 
                                onClick={handleCloseModal}
                                className="text-slate-500 hover:text-slate-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {loading && (
                                <div className="flex justify-center py-8">
                                    <Spinner size="lg" />
                                </div>
                            )}
                            
                            {error && (
                                <div className="text-center text-red-500 py-8">
                                    {error}
                                </div>
                            )}
                            
                            {!loading && !error && classDetails && (
                                <>
                                    <div className="mb-6">
                                        <p className="text-slate-600">
                                            Teacher: {classDetails.teacher?.name || 'Unknown'}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Access all learning materials for this class
                                        </p>
                                    </div>

                                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Pre-test Score */}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-semibold text-slate-700 mb-2">Pre-test</h4>
                                            {currentStudent?.pretestScore !== null ? (
                                                <div className="flex items-center gap-2 text-green-600 font-bold">
                                                    <CheckCircle size={20} />
                                                    <span>{currentStudent.pretestScore}%</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <XCircle size={20} />
                                                    <span>Not taken</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Post-test Score */}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-semibold text-slate-700 mb-2">Post-test</h4>
                                            {currentStudent?.posttestScore !== null ? (
                                                <div className="flex items-center gap-2 text-green-600 font-bold">
                                                    <CheckCircle size={20} />
                                                    <span>{currentStudent.posttestScore}%</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <XCircle size={20} />
                                                    <span>Not taken</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Retention Test Score */}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-semibold text-slate-700 mb-2">Retention Test</h4>
                                            {currentStudent?.retentionScore !== null ? (
                                                <div className="flex items-center gap-2 text-green-600 font-bold">
                                                    <CheckCircle size={20} />
                                                    <span>{currentStudent.retentionScore}%</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <XCircle size={20} />
                                                    <span>Not taken</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Retention Test Section */}
                                    {classDetails?.retentionTest && currentStudent && currentStudent.posttestScore !== null && (
                                        <div className="mt-8 mb-8">
                                            <h3 className="text-xl font-bold text-slate-800 mb-4">Retention Test</h3>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <div className="flex items-center justify-between flex-wrap gap-4">
                                                    <div>
                                                        <h4 className="font-medium text-slate-800">{classDetails.retentionTest.title}</h4>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Time limit: {classDetails.retentionTest.timeLimitMinutes} minutes
                                                        </p>
                                                    </div>
                                                    
                                                    {(() => {
                                                        const now = Date.now();
                                                        const endedAt = classDetails.classEndedAt ? new Date(classDetails.classEndedAt).getTime() : 0;
                                                        const delayMs = (classDetails.retentionTestDelayMinutes || 0) * 60 * 1000;
                                                        const unlockTime = endedAt + delayMs;
                                                        const isLocked = endedAt > 0 && now < unlockTime;
                                                        
                                                        if (currentStudent.retentionScore !== null) {
                                                            return (
                                                                <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                                                                     <CheckCircle size={20} />
                                                                     <span>Test Completed</span>
                                                                </div>
                                                            );
                                                        }

                                                        // If class hasn't ended, retention test is not available
                                                        if (endedAt === 0) {
                                                            return (
                                                                <div className="flex items-center gap-2 text-slate-400 font-medium bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                                                                    <Timer size={20} />
                                                                    <span>Not available yet</span>
                                                                </div>
                                                            );
                                                        }

                                                        if (isLocked) {
                                                            return (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="text-sm text-slate-500">Available in:</span>
                                                                    <CountdownTimer targetDate={new Date(unlockTime)} onComplete={() => setClassDetails({...classDetails})} />
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <Link
                                                                to={`/retention-test/${classInfo.id}`}
                                                                className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                                                            >
                                                                Start Test
                                                            </Link>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">Learning Materials</h3>
                                        
                                        {classDetails?.materials && classDetails.materials.length > 0 ? (
                                            <div className="space-y-3">
                                                {classDetails.materials.map((material: Material) => (
                                                    <MaterialItem key={material.id} material={material} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-500 py-12">
                                                <div className="max-w-md mx-auto">
                                                    <FileText size={48} className="mx-auto mb-4 text-slate-400" />
                                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No materials available</h3>
                                                    <p className="text-sm">Your teacher hasn't added any learning materials yet. Check back later!</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const MaterialItem: React.FC<{ material: Material }> = ({ material }) => {
    const Icon = material.type === 'youtube' ? Youtube : FileText;
    const iconColor = material.type === 'youtube' ? 'text-red-600' : material.type === 'pdf' ? 'text-red-500' : 'text-blue-500';

    const handleView = () => {
        if (material.type === 'youtube') {
            window.open(material.url, '_blank');
        } else {
            window.open(material.url, '_blank');
        }
    };

    const handleDownload = () => {
        if (material.type !== 'youtube') {
            const link = document.createElement('a');
            link.href = material.url;
            link.download = material.title;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
                <Icon size={20} className={iconColor} />
                <span className="font-medium text-slate-800">{material.title}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleView}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    <ExternalLink size={14} />
                    {material.type === 'youtube' ? 'Watch' : 'View'}
                </button>
                {material.type !== 'youtube' && (
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                        <Download size={14} />
                        Download
                    </button>
                )}
            </div>
        </div>
    );
};

const StudentDashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [classCode, setClassCode] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      const token = localStorage.getItem('authToken');
      if (user && token) {
        setLoading(true);
        try {
          const fetchedClasses = await getStudentClasses(token);
          setClasses(fetchedClasses);
        } catch (error) {
          console.error('Failed to fetch classes:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchClasses();
  }, [user]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token || !classCode) return;
    try {
      await enrollInClass(classCode, token);
      // Refresh classes
      const fetchedClasses = await getStudentClasses(token);
      setClasses(fetchedClasses);
      alert('Successfully joined the class!');
    } catch (error) {
      alert('Failed to join class. Please check the code and try again.');
    }
    setClassCode('');
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="Dashboard" />
      <main className="container mx-auto p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">Your Enrolled Classes</h1>
            {user?.studentId && (
                <p className="text-slate-600 mt-2 font-medium">
                    Student ID: <span className="text-teal-600">{user.studentId}</span>
                </p>
            )}
          </div>
          <form onSubmit={handleJoinClass} className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="Enter Class Code"
              className="px-4 py-3 border border-slate-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
            <button type="submit" className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
              <LogIn size={20} />
              Join
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center mt-16"><Spinner size="lg" /></div>
        ) : classes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map(c => <ClassCard key={c.id} classInfo={c} currentUserId={user?.id || ''} />)}
          </div>
        ) : (
          <div className="text-center bg-white p-12 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-slate-700">You're not enrolled in any classes.</h2>
            <p className="text-slate-500 mt-2">Enter a class code provided by your teacher to join a class.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;