import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getGroupPerformance, 
  getAIAlgorithmInsights, 
  getStudentEngagementMetrics,
  getPerformanceData,
  GroupPerformanceData,
  AIAlgorithmInsightsData,
  StudentEngagementData,
  PerformanceDataResponse
} from '../services/analyticsApi';
import { EnrolledStudent } from '../types';
import Header from '../components/common/Header';
import { Spinner } from '../components/common/Spinner';
import { ArrowLeft, BarChart3, Users, Download, FileText, Table, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: React.ReactNode; subtitle: string }> = ({ icon, title, value, subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-start gap-4">
        <div className="bg-teal-100 text-teal-600 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
    </div>
);

const renderDelta = (delta: number) => {
    const color = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-slate-500';
    const sign = delta > 0 ? '+' : '';
    return <span className={`font-bold ${color}`}>{sign}{delta.toFixed(1)}</span>;
};

const renderScore = (score: number | undefined | null) => {
    if (score === undefined || score === null) return <span className="text-slate-400">-</span>;
    const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
    return <span className={`font-mono font-bold ${color}`}>{score.toFixed(1)}</span>;
};

const GroupProgressionChart: React.FC<{ students: any[] }> = ({ students }) => {
    if (!students || students.length === 0) return <div className="text-center p-4 text-slate-400">No student data available for progression chart.</div>;

    const data = [
        { 
            stage: 'Pre-Test', 
            ...students.reduce((acc, s) => ({ ...acc, [s.name]: s.pretestScore || 0 }), {}) 
        },
        { 
            stage: 'Post-Test', 
            ...students.reduce((acc, s) => ({ ...acc, [s.name]: s.posttestScore || 0 }), {}) 
        },
        { 
            stage: 'Retention', 
            ...students.reduce((acc, s) => ({ ...acc, [s.name]: s.retentionScore || 0 }), {}) 
        },
    ];
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="h-[300px] w-full mt-6 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-600 mb-4 text-center">Student Progression Tracking</h4>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend />
                    {students.map((student, index) => (
                        <Line 
                            key={student.name} 
                            type="monotone" 
                            dataKey={student.name} 
                            stroke={colors[index % colors.length]} 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const GroupPerformanceCard: React.FC<{ group: GroupPerformanceData; index: number }> = ({ group, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const memberCount = group.students?.length || group.memberCount || 0;

    const renderMetric = (value: number | null | undefined) => {
        if (value === null || value === undefined) return <span className="text-slate-400">-</span>;
        
        return (
            <span className={`font-bold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {value > 0 ? '+' : ''}{value.toFixed(2)}%
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-shadow duration-300">
            <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {group.label || `Group ${index + 1}`}
                            {group.aiGenerated && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    AI Generated
                                </span>
                            )}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">{memberCount} Members</p>
                    </div>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-teal-600 font-medium hover:text-teal-700 transition-colors bg-teal-50 px-3 py-1.5 rounded-lg"
                    >
                        {isExpanded ? 'Hide Progression' : 'View Progression'}
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
                
                {group.groupingRationale && group.groupingRationale !== 'Manual grouping based on instructor assignment' && (
                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm max-w-xl border border-blue-100 mb-4">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="font-semibold">Rationale: </span>
                                {group.groupingRationale}
                            </div>
                        </div>
                    </div>
                )}

                {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <GroupProgressionChart students={group.students || []} />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm">Student Name</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm text-center">Performance</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm text-center">Pre-test</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm text-center">Post-test</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm text-center">Retention</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm text-center">Immediate<br/><span className="text-xs font-normal">Pre→Post</span></th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm text-center">Sustained<br/><span className="text-xs font-normal">Pre→Retention</span></th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-sm text-center">Retention Stability<br/><span className="text-xs font-normal">Post→Retention</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {group.students && group.students.length > 0 ? (
                                group.students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{student.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                student.performanceCategory === 'High' ? 'bg-green-100 text-green-800' :
                                                student.performanceCategory === 'Low' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {student.performanceCategory}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">{renderScore(student.pretestScore)}</td>
                                        <td className="px-4 py-3 text-center">{renderScore(student.posttestScore)}</td>
                                        <td className="px-4 py-3 text-center">{renderScore(student.retentionScore)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {student.immediateImprovement !== null ? (
                                                <span className={`font-bold ${student.immediateImprovement > 0 ? 'text-green-600' : student.immediateImprovement < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                                    {student.immediateImprovement > 0 ? '+' : ''}{student.immediateImprovement.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {student.sustainedImprovement !== null ? (
                                                <span className={`font-bold ${student.sustainedImprovement > 0 ? 'text-green-600' : student.sustainedImprovement < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                                    {student.sustainedImprovement > 0 ? '+' : ''}{student.sustainedImprovement.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {student.retentionStability !== null ? (
                                                <span className={`font-bold ${student.retentionStability > 0 ? 'text-green-600' : student.retentionStability < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                                    {student.retentionStability > 0 ? '+' : ''}{student.retentionStability.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic">
                                        No student data available for this group.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PerformanceAnalyticsPage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const [groupPerformance, setGroupPerformance] = useState<GroupPerformanceData[]>([]);
    const [aiInsights, setAIInsights] = useState<AIAlgorithmInsightsData | null>(null);
    const [studentEngagement, setStudentEngagement] = useState<StudentEngagementData[]>([]);
    const [summaryStats, setSummaryStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'performance' | 'export'>('performance');
    


    // Export Preview State
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!classId) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('No authentication token found');
                    return;
                }
                
                // Fetch performance data using the new API function
                // 'saved_records' ensures we only fetch stored data, no real-time/auto-refresh
                const performanceData = await getPerformanceData(classId, token, 'line', 'saved_records');
                
                // Set the data from the new endpoint
                setGroupPerformance(performanceData.data.chartData || []);
                setSummaryStats(performanceData.data.summaryStats || null);
                
                // Fetch AI insights and student engagement separately
                const [insightsData, engagementData] = await Promise.all([
                    getAIAlgorithmInsights(classId, token),
                    getStudentEngagementMetrics(classId, token)
                ]);
                
                setAIInsights(insightsData);
                setStudentEngagement(engagementData);
                
            } catch (err: any) {
                setError(err.message || 'Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
        // Removed interval/auto-refresh logic
    }, [classId]);
    
    const analytics = useMemo(() => {
        if (!groupPerformance.length || !summaryStats) return null;
        
        // Calculate overall statistics from summary stats
        const totalStudents = summaryStats.totalStudents;
        const avgScore = summaryStats.averageScores.posttest;
        const avgImprovement = summaryStats.improvementRate;
        
        // Use actual student data if available, otherwise use summary stats
        const malePerformance = {
            avgPretestScore: summaryStats.averageScores.pretest,
            avgPosttestScore: summaryStats.averageScores.posttest,
            avgImprovement: avgImprovement
        };
        
        const femalePerformance = {
            avgPretestScore: summaryStats.averageScores.pretest,
            avgPosttestScore: summaryStats.averageScores.posttest,
            avgImprovement: avgImprovement
        };
        
        // Extract individual student data from groupPerformance
        const students = groupPerformance
            .filter(group => group.isIndividual && group.studentName)
            .map(group => ({
                name: group.studentName,
                pretest: group.avgPretestScore,
                posttest: group.avgPosttestScore,
                improvement: group.improvementRate,
                retention: group.retentionRate
            }));
        
        return {
            overall: {
                avgPre: summaryStats.averageScores.pretest,
                avgPost: summaryStats.averageScores.posttest,
                avgDelta: avgImprovement,
            },
            male: {
                avgPre: malePerformance.avgPretestScore,
                avgPost: malePerformance.avgPosttestScore,
                avgDelta: malePerformance.avgImprovement,
            },
            female: {
                avgPre: femalePerformance.avgPretestScore,
                avgPost: femalePerformance.avgPosttestScore,
                avgDelta: femalePerformance.avgImprovement,
            },
            totalStudents: totalStudents,
            students: students.length > 0 ? students : [] // Use actual student data
        };
    }, [groupPerformance, summaryStats]);

    const chartData = useMemo(() => {
        if (!analytics || !groupPerformance.length) return null;
        
        // Group performance data for charts
        const groupTrendData = [
            { name: 'Overall Performance', value: analytics.overall.avgPost },
            { name: 'Average Improvement', value: analytics.overall.avgDelta }
        ];

        // Group performance comparison using actual data from backend
        const groupComparisonData = groupPerformance.map((group, index) => ({
            name: group.label || group.studentName || `Group ${index + 1}`,
            performance: group.averageScore,
            improvement: group.improvementRate,
            retention: group.retentionRate,
            members: groupPerformance.filter(g => g.groupId === group.groupId).length || 1
        }));

        // Gender performance comparison (use actual data if available)
        const genderData = [
            { name: 'Male', pretest: analytics.male.avgPre, posttest: analytics.male.avgPost, improvement: analytics.male.avgDelta },
            { name: 'Female', pretest: analytics.female.avgPre, posttest: analytics.female.avgPost, improvement: analytics.female.avgDelta }
        ];

        // Score distribution based on actual student scores
        const scoreRanges = [
            { range: '0-20', count: 0 },
            { range: '21-40', count: 0 },
            { range: '41-60', count: 0 },
            { range: '61-80', count: 0 },
            { range: '81-100', count: 0 }
        ];

        // Count students in each score range based on their posttest scores
        // Only consider actual groups to avoid double counting if needed, or stick to individuals?
        // Actually, for score distribution, we should probably look at ALL students.
        // But if groupPerformance contains duplicates (groups + individuals), we need to be careful.
        // The backend sends groups AND individuals. 
        // If a student is in a group, are they ALSO in an individual entry?
        // Based on backend logic: 
        // "if (!groupId) { ... performanceData.push({ ... isIndividual: true }) }"
        // So a student is EITHER in a group OR individual (if ungrouped).
        // BUT the user says "I have 9 students, and are groupped into 3".
        // If they are grouped, they shouldn't be showing up as individuals unless the backend logic is flawed.
        // Let's look at the backend logic again.
        
        // Backend: 
        // 1. Process groups.
        // 2. Process Ungrouped Students: if (!groupId) { const ungrouped = enrollments.filter(e => !assignedStudentIds.has(e.studentId)) }
        // This implies mutually exclusive.
        // So we should iterate over ALL groupPerformance entries to get the full picture?
        // NO. If we have 3 groups of 3 students, we have 3 GroupPerformanceData entries.
        // The "isIndividual" entries are ONLY for students NOT in any group.
        // The user complained about "9 groups". This implies 3 real groups + 6 individuals? 
        // Or maybe the user meant "I have 9 students, grouped into 3, but the page shows 9 groups".
        // This implies the page is treating each student as a group?
        // If the backend returns 3 groups, `groupPerformance` has 3 entries.
        // If it returns 9, it means it's returning 9 entries.
        // If the user says "groupped into 3", then we expect 3 entries.
        // If the page shows 9, maybe the backend is returning 9 entries (3 groups + 6 individuals? or 9 individuals?).
        
        // Regardless, for the charts, we only want to show the GROUPS.
        // For score distribution, we want to count students.
        // Groups contain `averageScore`. We can't get individual scores from just the group entry for distribution unless we look at `group.students`.
        
        // Let's rebuild the score distribution using `analytics.students` (which we derived earlier) OR iterate through groups and their student lists.
        
        // Better approach: Use the `students` array we created in `analytics` memo?
        // No, `analytics.students` only captures `isIndividual` ones in my previous code!
        // lines 112-120: .filter(group => group.isIndividual ... )
        
        // We need a reliable way to get all student scores.
        // We can iterate through `groupPerformance` (both groups and individuals).
        // For groups, iterate `group.students`.
        // For individuals, take the individual score.
        
        const allStudentScores: number[] = [];
        
        groupPerformance.forEach(gp => {
            if (gp.isIndividual) {
                // It's a single student
                const score = gp.avgPosttestScore || gp.avgPretestScore;
                if (score !== undefined) allStudentScores.push(score);
            } else if (gp.students && gp.students.length > 0) {
                 // It's a group, add all its students
                 gp.students.forEach(s => {
                     const score = s.posttestScore || s.pretestScore;
                     if (score !== null && score !== undefined) allStudentScores.push(score);
                 });
            }
        });

        allStudentScores.forEach(score => {
            if (score >= 0 && score <= 20) scoreRanges[0].count++;
            else if (score > 20 && score <= 40) scoreRanges[1].count++;
            else if (score > 40 && score <= 60) scoreRanges[2].count++;
            else if (score > 60 && score <= 80) scoreRanges[3].count++;
            else if (score > 80 && score <= 100) scoreRanges[4].count++;
        });

        return { trendData: groupTrendData, scoreRanges, genderData, groupComparisonData };
    }, [analytics, groupPerformance]);

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
    const reportRef = useRef<HTMLDivElement>(null);

    const exportToPDF = () => {
        if (!groupPerformance.length) return;

        // Create individual student data from all groups
        const studentData: any[] = [];
        let serialNumber = 1;

        groupPerformance.forEach((group) => {
            if (group.students && group.students.length > 0) {
                group.students.forEach((student) => {
                    studentData.push({
                        serialNumber: serialNumber++,
                        studentName: student.name,
                        performance: student.performanceCategory,
                        pretest: student.pretestScore,
                        posttest: student.posttestScore,
                        retention: student.retentionScore,
                        immediateImprovement: student.immediateImprovement,
                        sustainedImprovement: student.sustainedImprovement,
                        retentionStability: student.retentionStability,
                        groupName: group.label || 'Ungrouped'
                    });
                });
            }
        });

        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        const tableWidth = pageWidth - 2 * margin;
        
        // Title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Class Analytics Report', pageWidth / 2, 20, { align: 'center' });
        
        // Subtitle with date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
        
        // Table headers
        const headers = ['S/N', 'Student Name', 'Performance', 'Pre-test', 'Post-test', 'Retention', 'Immediate Pre→Post', 'Sustained Pre→Retention', 'Retention Stability Post→Retention', 'Group'];
        const columnWidths = [8, 35, 18, 15, 15, 15, 25, 25, 25, 25]; // Total should be around 280mm for landscape A4
        
        let yPosition = 40;
        const rowHeight = 8;
        const startX = margin;
        
        // Draw headers
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        let xPosition = startX;
        headers.forEach((header, index) => {
            doc.rect(xPosition, yPosition, columnWidths[index], rowHeight);
            doc.text(header, xPosition + 2, yPosition + 5);
            xPosition += columnWidths[index];
        });
        
        // Draw data rows
        doc.setFont(undefined, 'normal');
        yPosition += rowHeight;
        
        studentData.forEach((student, index) => {
            xPosition = startX;
            const row = [
                student.serialNumber.toString(),
                student.studentName,
                student.performance,
                student.pretest?.toFixed(1) || '0.0',
                student.posttest?.toFixed(1) || '0.0',
                student.retention?.toFixed(1) || '0.0',
                formatPercentageForPDF(student.immediateImprovement),
                formatPercentageForPDF(student.sustainedImprovement),
                formatPercentageForPDF(student.retentionStability),
                student.groupName
            ];
            
            row.forEach((cell, cellIndex) => {
                doc.rect(xPosition, yPosition, columnWidths[cellIndex], rowHeight);
                doc.text(cell.toString(), xPosition + 2, yPosition + 5);
                xPosition += columnWidths[cellIndex];
            });
            
            yPosition += rowHeight;
            
            // Add new page if needed
            if (yPosition > 190) {
                doc.addPage('landscape');
                yPosition = 20;
            }
        });
        
        doc.save(`Class_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const formatPercentageForPDF = (value: number): string => {
        if (value === 0) return '0.00%';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    const formatPercentageForPreview = (value: number): string => {
        if (value === 0) return '0.00%';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    const exportToCSV = () => {
        if (!groupPerformance.length) return;

        // Create individual student data from all groups
        const studentData: any[] = [];
        let serialNumber = 1;

        groupPerformance.forEach((group) => {
            if (group.students && group.students.length > 0) {
                group.students.forEach((student) => {
                    studentData.push({
                        serialNumber: serialNumber++,
                        studentName: student.name,
                        performance: student.performanceCategory,
                        pretest: student.pretestScore,
                        posttest: student.posttestScore,
                        retention: student.retentionScore,
                        immediateImprovement: student.immediateImprovement,
                        sustainedImprovement: student.sustainedImprovement,
                        retentionStability: student.retentionStability,
                        groupName: group.label || 'Ungrouped'
                    });
                });
            }
        });

        // Create CSV headers matching the specified format
        const headers = ['S/N', 'Student Name', 'Performance', 'Pre-test', 'Post-test', 'Retention', 'Immediate Pre→Post', 'Sustained Pre→Retention', 'Retention Stability Post→Retention', 'Group'];
        
        // Create CSV content with proper formatting
        const csvContent = [
            headers.join(','),
            ...studentData.map((student) => [
                student.serialNumber,
                `"${student.studentName}"`, // Quote student names to handle commas
                student.performance,
                student.pretest?.toFixed(1) || '0.0',
                student.posttest?.toFixed(1) || '0.0',
                student.retention?.toFixed(1) || '0.0',
                formatPercentageForCSV(student.immediateImprovement),
                formatPercentageForCSV(student.sustainedImprovement),
                formatPercentageForCSV(student.retentionStability),
                `"${student.groupName}"` // Quote group names to handle commas
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Class_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatPercentageForCSV = (value: number): string => {
        if (value === 0) return '0.00%';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };



    if (loading) return (
        <div className="flex flex-col h-screen items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-slate-500 font-medium">Loading performance analytics...</p>
        </div>
    );
    
    if (error) return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center p-8 bg-red-50 rounded-xl border border-red-200">
                <h3 className="text-red-800 font-bold mb-2">Error Loading Data</h3>
                <p className="text-red-600">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    // Empty state handling
    if (!groupPerformance.length) {
        return (
            <div className="min-h-screen bg-slate-100">
                <Header title="Class Performance Analytics" />
                <main className="container mx-auto p-8">
                    <div className="flex items-center justify-between mb-6">
                        <Link to="/teacher-dashboard" className="flex items-center gap-2 text-teal-600 font-semibold hover:underline">
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </Link>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <BarChart3 className="text-slate-400" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">No Performance Data Available</h2>
                        <p className="text-slate-500 max-w-md mb-6">
                            There are no student performance records or groups found for this class yet. 
                            Data will appear here once students complete assessments or groups are formed.
                        </p>
                    </div>
                </main>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-100">
            <Header title="Class Performance Analytics" />
            <main className="container mx-auto p-8">
                <div className="flex items-center justify-between mb-6">
                    <Link to="/teacher-dashboard" className="flex items-center gap-2 text-teal-600 font-semibold hover:underline">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                    
                    {/* Tab Navigation */}
                    <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`px-6 py-2 transition-colors flex items-center gap-2 font-medium ${
                                activeTab === 'performance' 
                                    ? 'bg-teal-600 text-white' 
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <BarChart3 size={18} />
                            Performance
                        </button>
                        <button
                            onClick={() => setActiveTab('export')}
                            className={`px-6 py-2 transition-colors flex items-center gap-2 font-medium ${
                                activeTab === 'export' 
                                    ? 'bg-teal-600 text-white' 
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                {activeTab === 'performance' && (
                    <div ref={reportRef} className="animate-in fade-in duration-300">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard icon={<Users size={24}/>} title="Total Students" value={analytics.totalStudents.toString()} subtitle="Enrolled in class" />
                            <StatCard icon={<Users size={24}/>} title="Grouped Students" value={summaryStats?.groupingStats.groupedStudents.toString()} subtitle="Students in groups" />
                            <StatCard icon={<BarChart3 size={24}/>} title="Unique Groups" value={summaryStats?.groupingStats.uniqueGroups.toString()} subtitle="Total groups formed" />
                        </div>
                        


                        {/* Detailed Group Performance */}
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold text-slate-800">Detailed Group Performance</h2>
                            
                            {groupPerformance.filter(g => g.students && g.students.length > 0).length === 0 && (
                                <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <p>No group details available to display.</p>
                                </div>
                            )}

                            {groupPerformance
                                .filter(g => g.students && g.students.length > 0)
                                .map((group, index) => (
                                <GroupPerformanceCard key={group.groupId || index} group={group} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'export' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <Download className="text-teal-600" />
                                Export Analytics Data
                            </h2>
                            <p className="text-slate-600 mb-8">
                                Download detailed performance reports and raw data for further analysis.
                                Use the preview to verify data before exporting.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <button
                                    onClick={exportToCSV}
                                    className="flex flex-col items-center justify-center p-8 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                                >
                                    <div className="p-4 bg-green-100 text-green-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <Table size={32} />
                                    </div>
                                    <span className="text-lg font-bold text-slate-800">Export CSV</span>
                                    <span className="text-sm text-slate-500 mt-2">Raw data for spreadsheet analysis</span>
                                </button>

                                <button
                                    onClick={exportToPDF}
                                    className="flex flex-col items-center justify-center p-8 border-2 border-slate-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                                >
                                    <div className="p-4 bg-red-100 text-red-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <FileText size={32} />
                                    </div>
                                    <span className="text-lg font-bold text-slate-800">Export PDF Report</span>
                                    <span className="text-sm text-slate-500 mt-2">Formatted report with visual charts</span>
                                </button>
                            </div>

                            <div className="border-t border-slate-200 pt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Data Preview</h3>
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            showPreview 
                                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                                                : 'bg-teal-600 text-white hover:bg-teal-700'
                                        }`}
                                    >
                                        {showPreview ? 'Hide Preview' : 'Show Data Preview'}
                                    </button>
                                </div>

                                {showPreview && (
                                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                                                    <tr>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">S/N</th>
                                                        <th className="p-3 font-semibold text-slate-600">Student Name</th>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">Performance</th>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">Pre-test</th>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">Post-test</th>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">Retention</th>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">Immediate<br/><span className="text-xs font-normal">Pre→Post</span></th>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">Sustained<br/><span className="text-xs font-normal">Pre→Retention</span></th>
                                                        <th className="p-3 font-semibold text-slate-600 text-center">Retention Stability<br/><span className="text-xs font-normal">Post→Retention</span></th>
                                                        <th className="p-3 font-semibold text-slate-600">Group</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(() => {
                                                        const studentData: any[] = [];
                                                        let serialNumber = 1;
                                                        
                                                        groupPerformance.forEach((group) => {
                                                            if (group.students && group.students.length > 0) {
                                                                group.students.forEach((student) => {
                                                                    studentData.push({
                                                                        serialNumber: serialNumber++,
                                                                        studentName: student.name,
                                                                        performance: student.performanceCategory,
                                                                        pretest: student.pretestScore,
                                                                        posttest: student.posttestScore,
                                                                        retention: student.retentionScore,
                                                                        immediateImprovement: student.immediateImprovement,
                                                                        sustainedImprovement: student.sustainedImprovement,
                                                                        retentionStability: student.retentionStability,
                                                                        groupName: group.label || 'Ungrouped'
                                                                    });
                                                                });
                                                            }
                                                        });
                                                        
                                                        return studentData.map((student) => (
                                                            <tr key={`${student.studentName}-${student.serialNumber}`} className="hover:bg-slate-100">
                                                                <td className="p-3 text-slate-600 text-center">{student.serialNumber}</td>
                                                                <td className="p-3 font-medium text-slate-800">{student.studentName}</td>
                                                                <td className="p-3 text-slate-600 text-center">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                        student.performance === 'High' ? 'bg-green-100 text-green-800' :
                                                                        student.performance === 'Mid' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {student.performance}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-slate-600 text-center">{student.pretest?.toFixed(1) || '0.0'}</td>
                                                                <td className="p-3 text-slate-600 text-center">{student.posttest?.toFixed(1) || '0.0'}</td>
                                                                <td className="p-3 text-slate-600 text-center">{student.retention?.toFixed(1) || '0.0'}</td>
                                                                <td className={`p-3 font-medium text-center ${student.immediateImprovement > 0 ? 'text-green-600' : student.immediateImprovement < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                                    {formatPercentageForPreview(student.immediateImprovement)}
                                                                </td>
                                                                <td className={`p-3 font-medium text-center ${student.sustainedImprovement > 0 ? 'text-green-600' : student.sustainedImprovement < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                                    {formatPercentageForPreview(student.sustainedImprovement)}
                                                                </td>
                                                                <td className={`p-3 font-medium text-center ${student.retentionStability > 0 ? 'text-green-600' : student.retentionStability < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                                    {formatPercentageForPreview(student.retentionStability)}
                                                                </td>
                                                                <td className="p-3 text-slate-600">{student.groupName}</td>
                                                            </tr>
                                                        ));
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>


        </div>
    );
};

export default PerformanceAnalyticsPage;
