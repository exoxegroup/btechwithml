
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassDetails, assignStudentsToGroups, generateAIGroups, generateManualGroups, AIGroupingResult } from '../../services/api';
import { ClassDetails, EnrolledStudent } from '../../types';
import Header from '../../components/common/Header';
import { Spinner } from '../../components/common/Spinner';
import { ArrowLeft, Users, Save, Brain, Info, Edit3, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManageStudentsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [autoGroupCount, setAutoGroupCount] = useState(2);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const [aiGroupingResult, setAiGroupingResult] = useState<AIGroupingResult | null>(null);
  const [groupingRationale, setGroupingRationale] = useState<string>('');
  const [showRationale, setShowRationale] = useState(false);
  const [groupingMode, setGroupingMode] = useState<'ai' | 'manual' | null>(null);
  const [isManualModeEnabled, setIsManualModeEnabled] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!classId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Authentication required. Please log in.');
          setLoading(false);
          return;
        }
        
        const details = await getClassDetails(classId, token);
        if (details) {
          setClassDetails(details);
          setStudents(details.students || []);
        } else {
          toast.error('Class not found.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load class details.';
        if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
          toast.error('You do not have access to this class or it does not exist.');
        } else {
          toast.error('Failed to load class details.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [classId]);

  const handleGroupChange = (studentId: string, groupNumberStr: string) => {
    const groupNumber = groupNumberStr === '' ? null : parseInt(groupNumberStr, 10);
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, groupNumber: isNaN(groupNumber!) ? null : groupNumber } : s))
    );
  };
  
  const handleAutoAssign = async (mode: 'ai' | 'manual') => {
    if (mode === 'ai' && autoGroupCount <= 0) {
      alert("Number of groups must be greater than zero.");
      return;
    }

    setIsGeneratingGroups(true);
    setError('');
    setGroupingMode(mode);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        setIsGeneratingGroups(false);
        return;
      }

      // Validate class ownership before generating groups
      if (!classDetails) {
        toast.error('Class details not loaded. Please refresh the page.');
        setIsGeneratingGroups(false);
        return;
      }

      let result;
      if (mode === 'manual') {
        // Generate manual groups for small classes
        result = await generateManualGroups(classId!, token);
      } else {
        // Generate AI-powered groups
        result = await generateAIGroups(classId!, token, autoGroupCount);
      }
      
      if (result && result.groups && result.groups.length > 0) {
        setAiGroupingResult(result);
        setGroupingRationale(result.rationale || '');
        
        // Disable manual mode when AI assigns groups
        setIsManualModeEnabled(false);
        
        // Apply the group assignments to students
        const updatedStudents = [...students];
        
        result.groups.forEach((group: any) => {
          group.studentIds.forEach((studentId: string) => {
            const studentIndex = updatedStudents.findIndex(s => s.id === studentId);
            if (studentIndex !== -1) {
              // Extract group number from group name (e.g., "Team Alpha" -> 1, "Team Beta" -> 2)
              const groupName = group.name || group.groupName || '';
              const groupNumber = extractGroupNumber(groupName) || (result.groups.indexOf(group) + 1);
              updatedStudents[studentIndex].groupNumber = groupNumber;
            }
          });
        });
        
        setStudents(updatedStudents);
        
        // Show success message with analytics
        const analytics = result.genderBalance || {};
        const modeText = mode === 'manual' ? 'Manual' : 'AI';
        toast.success(`${modeText} groups generated successfully!`, {
          duration: 5000,
          icon: '🎉',
          style: {
            background: '#10B981',
            color: '#fff',
          }
        });
      } else {
        toast.error(`Failed to generate ${mode} groups. Please try again.`);
      }
    } catch (err: any) {
      console.error(`${mode} Grouping Error:`, err);
      console.error('Error message:', err.message);
      console.error('Error object:', err);
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('pretest')) {
        toast.error('Cannot generate groups: All students must complete the pretest first.');
      } else if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
        toast.error('You do not have permission to generate groups for this class.');
      } else if (errorMessage.includes('at least 8 students') || errorMessage.includes('minimum 8 students')) {
        toast.error('Cannot generate groups: Class must have at least 8 students for AI grouping. For smaller classes, use manual grouping instead.');
      } else if (errorMessage.includes('at least 3 students') || errorMessage.includes('minimum 3 students')) {
        toast.error(`Cannot generate groups: At least 3 students are required for H-M-L distribution. Currently only ${students.length} student(s) enrolled.`);
      } else if (errorMessage.includes('3-7 students')) {
        toast.error('Cannot generate groups: Manual grouping works for 3-7 students. Use AI grouping for larger classes.');
      } else if (errorMessage.includes('Currently') && errorMessage.includes('student')) {
        // Handle the detailed backend message format
        if (mode === 'ai' && errorMessage.includes('8 students')) {
          toast.error('Cannot generate AI groups: ' + errorMessage + ' Use manual grouping for smaller classes.');
        } else if (mode === 'manual' && errorMessage.includes('3 students')) {
          toast.error('Cannot generate manual groups: ' + errorMessage);
        } else {
          toast.error('Cannot generate groups: ' + errorMessage);
        }
      } else {
        toast.error(`Failed to generate ${mode} groups. ` + (errorMessage || 'Please try again.'));
      }
    } finally {
      setIsGeneratingGroups(false);
    }
  };

  // Helper function to extract group number from group name
  const extractGroupNumber = (groupName: string): number | null => {
    // Try to extract number from names like "Team 1", "Group Alpha", "Team A"
    const numberMatch = groupName.match(/\d+/);
    if (numberMatch) return parseInt(numberMatch[0], 10);
    
    // Try to map letter to number (A=1, B=2, etc.)
    // Look for a single letter at the end of the string or preceded by a space
    const letterMatch = groupName.match(/(?:^|\s)([A-Za-z])$/);
    if (letterMatch) {
      const letter = letterMatch[1].toUpperCase();
      const charCode = letter.charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) { // A-Z
        return charCode - 64; // A=1, B=2, etc.
      }
    }
    
    // Fallback: Check for any letter if the above didn't match (for "Team A")
    const simpleLetterMatch = groupName.match(/Team\s+([A-Za-z])/i);
    if (simpleLetterMatch) {
        const letter = simpleLetterMatch[1].toUpperCase();
        return letter.charCodeAt(0) - 64;
    }
    
    return null;
  };

  const handleSaveChanges = async () => {
    if (!classId) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        setIsSaving(false);
        return;
      }
      
      const assignments = students.map(s => ({ studentId: s.id, groupNumber: s.groupNumber }));
      await assignStudentsToGroups(classId, assignments, token);
      toast.success('Group assignments saved successfully!', {
        duration: 3000,
        icon: '✅'
      });
    } catch (err) {
      toast.error('Failed to save group assignments.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <Header title={`Manage Students: ${classDetails?.name}`} />
      <main className="container mx-auto p-8">
        <Link to="/teacher-dashboard" className="flex items-center gap-2 text-teal-600 font-semibold mb-6 hover:underline">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Workflow Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                    <Info size={18} />
                    How to Assign Groups
                </h3>
                <div className="text-blue-700 text-sm space-y-1">
                    <p><strong>Option 1 - AI Auto-Assign:</strong> Click "AI Auto-Assign" to automatically group students based on performance and gender balance.</p>
                    <p><strong>Option 2 - Manual Assignment:</strong> Click "Manual Mode" to enable input fields, then enter group numbers for each student.</p>
                    <p><strong>Save:</strong> Always click "Save Group Assignments" to save your changes.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4 mb-4">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Users size={28}/> Enrolled Students ({students.length})
                </h2>
                <div className="flex items-center gap-2">
                    <input 
                        type="number"
                        min="1"
                        value={autoGroupCount}
                        onChange={e => setAutoGroupCount(parseInt(e.target.value, 10) || 1)}
                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button 
                        onClick={() => handleAutoAssign('ai')}
                        disabled={isGeneratingGroups}
                        className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                       {isGeneratingGroups && groupingMode === 'ai' ? <Spinner size="sm"/> : <Brain size={16}/>}
                       {isGeneratingGroups && groupingMode === 'ai' ? 'Generating...' : 'AI Auto-Assign'}
                    </button>
                    <button 
                        onClick={() => handleAutoAssign('manual')}
                        disabled={isGeneratingGroups}
                        className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                        title="Manual grouping for small classes (3-7 students)"
                    >
                       {isGeneratingGroups && groupingMode === 'manual' ? <Spinner size="sm"/> : <Users size={16}/>}
                       {isGeneratingGroups && groupingMode === 'manual' ? 'Generating...' : 'Manual Group'}
                    </button>
                    <button 
                        onClick={() => setIsManualModeEnabled(!isManualModeEnabled)}
                        className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors ${
                            isManualModeEnabled 
                                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        title={isManualModeEnabled ? 'Disable manual editing' : 'Enable manual editing'}
                    >
                       {isManualModeEnabled ? <Lock size={16}/> : <Edit3 size={16}/>}
                       {isManualModeEnabled ? 'Manual Mode' : 'Manual Mode'}
                    </button>
                </div>
            </div>

            {/* Manual Mode Indicator */}
            {isManualModeEnabled && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Edit3 size={20} className="text-orange-600" />
                  <h3 className="text-orange-800 font-semibold">Manual Mode Enabled</h3>
                </div>
                <p className="text-orange-700 text-sm mt-1">
                  You can now manually assign students to groups. Enter group numbers (1, 2, 3, etc.) for each student.
                </p>
              </div>
            )}

            {/* Grouping Results and Rationale */}
            {aiGroupingResult && (
              <div className={`${groupingMode === 'manual' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-semibold ${groupingMode === 'manual' ? 'text-green-800' : 'text-blue-800'} flex items-center gap-2`}>
                    {groupingMode === 'manual' ? <Users size={20}/> : <Brain size={20}/>} 
                    {groupingMode === 'manual' ? 'Manual' : 'AI'} Grouping Results
                  </h3>
                  <button
                    onClick={() => setShowRationale(!showRationale)}
                    className={`flex items-center gap-1 text-sm ${groupingMode === 'manual' ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    <Info size={16}/>
                    {showRationale ? 'Hide' : 'Show'} Rationale
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className={`font-bold ${groupingMode === 'manual' ? 'text-green-800' : 'text-blue-800'}`}>{aiGroupingResult.groups?.length || 0}</div>
                    <div className={`${groupingMode === 'manual' ? 'text-green-600' : 'text-blue-600'}`}>Groups Created</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${groupingMode === 'manual' ? 'text-green-800' : 'text-blue-800'}`}>{aiGroupingResult.totalStudents || students.length}</div>
                    <div className={`${groupingMode === 'manual' ? 'text-green-600' : 'text-blue-600'}`}>Students Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${groupingMode === 'manual' ? 'text-green-800' : 'text-blue-800'}`}>
                      {aiGroupingResult.genderBalance?.balancedGroups || 0}/{aiGroupingResult.genderBalance?.totalGroups || aiGroupingResult.groups?.length || 0}
                    </div>
                    <div className={`${groupingMode === 'manual' ? 'text-green-600' : 'text-blue-600'}`}>Balanced Groups</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${groupingMode === 'manual' ? 'text-green-800' : 'text-blue-800'}`}>
                      {aiGroupingResult.performanceBalance?.scoreStandardDeviation || 'N/A'}
                    </div>
                    <div className={`${groupingMode === 'manual' ? 'text-green-600' : 'text-blue-600'}`}>Score Std Dev</div>
                  </div>
                </div>
                
                {showRationale && groupingRationale && (
                  <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">AI Grouping Rationale:</h4>
                    <p className="text-blue-700 text-sm leading-relaxed">{groupingRationale}</p>
                    
                    {aiGroupingResult.genderBalanceAnalysis && (
                      <div className="mt-2">
                        <h5 className="font-medium text-blue-800 text-sm">Gender Balance Analysis:</h5>
                        <p className="text-blue-600 text-xs">{aiGroupingResult.genderBalanceAnalysis}</p>
                      </div>
                    )}
                    
                    {aiGroupingResult.performanceBalanceAnalysis && (
                      <div className="mt-2">
                        <h5 className="font-medium text-blue-800 text-sm">Performance Balance Analysis:</h5>
                        <p className="text-blue-600 text-xs">{aiGroupingResult.performanceBalanceAnalysis}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {students.map(student => (
                    <div key={student.id} className="grid grid-cols-3 items-center bg-slate-50 p-3 rounded-lg hover:bg-slate-100">
                        <div className="col-span-2 flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-800">{student.name}</span>
                                {student.studentId && (
                                    <span className="text-xs text-slate-500">ID: {student.studentId}</span>
                                )}
                            </div>
                            {student.pretestScore !== null ? (
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    student.pretestScore >= 80 ? 'bg-green-100 text-green-700' :
                                    student.pretestScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    Pretest: {Number(student.pretestScore).toFixed(2)}%
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-500">
                                    Not Taken
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor={`group-${student.id}`} className="text-sm font-semibold text-slate-600">Group:</label>
                            <div className="relative">
                                <input
                                    id={`group-${student.id}`}
                                    type="number"
                                    value={student.groupNumber ?? ''}
                                    onChange={e => handleGroupChange(student.id, e.target.value)}
                                    placeholder={isManualModeEnabled ? "Group #" : "N/A"}
                                    min="1"
                                    disabled={!isManualModeEnabled}
                                    className={`w-20 px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                                        isManualModeEnabled 
                                            ? 'border-slate-300 bg-white focus:ring-teal-500' 
                                            : 'border-slate-200 bg-slate-100 cursor-not-allowed text-slate-500'
                                    }`}
                                />
                                {!isManualModeEnabled && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <Lock size={12} className="text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 border-t pt-6 flex justify-end">
                <button 
                    onClick={handleSaveChanges} 
                    disabled={isSaving || (!isManualModeEnabled && !aiGroupingResult)}
                    className="flex items-center gap-2 bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:bg-teal-400 disabled:cursor-not-allowed"
                    title={!isManualModeEnabled && !aiGroupingResult ? "Generate groups first or enable manual mode" : "Save current group assignments"}
                >
                    {isSaving ? <Spinner size="sm"/> : <Save size={18}/>}
                    Save Group Assignments
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default ManageStudentsPage;
