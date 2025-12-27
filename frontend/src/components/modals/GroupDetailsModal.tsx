import React from 'react';
import { X, Trophy, TrendingUp, Brain, Users, Info } from 'lucide-react';
import { GroupPerformanceData, GroupStudentDetail } from '../../services/analyticsApi';

interface GroupDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: GroupPerformanceData | null;
}

const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ isOpen, onClose, group }) => {
    if (!isOpen || !group) return null;

    // Helper to render score with color
    const renderScore = (score: number | null) => {
        if (score === null || score === undefined) return <span className="text-slate-400">-</span>;
        const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-mono font-bold ${color}`}>{score.toFixed(1)}</span>;
    };

    // Helper to render rate with color and sign
    const renderRate = (rate: number) => {
        const color = rate > 0 ? 'text-green-600' : rate < 0 ? 'text-red-600' : 'text-slate-500';
        const sign = rate > 0 ? '+' : '';
        return <span className={`font-mono font-bold ${color}`}>{sign}{rate.toFixed(1)}%</span>;
    };

    // Helper for performance category badge
    const renderPerformanceBadge = (category: 'High' | 'Mid' | 'Low') => {
        const colors = {
            High: 'bg-green-100 text-green-800 border-green-200',
            Mid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            Low: 'bg-red-100 text-red-800 border-red-200'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[category]}`}>
                {category}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${group.aiGenerated ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                            {group.aiGenerated ? <Brain size={24} /> : <Users size={24} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{group.label || group.studentName || 'Group Details'}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>{group.memberCount} Members</span>
                                <span>•</span>
                                <span className={group.aiGenerated ? 'text-blue-600 font-medium' : 'text-teal-600 font-medium'}>
                                    {group.aiGenerated ? 'AI Generated' : 'Manually Created'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Rationale Section */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                        <div className="flex items-start gap-3">
                            <Info className="text-slate-400 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Grouping Rationale</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {group.groupingRationale || "No specific rationale recorded for this group."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Group Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Avg Score</p>
                            <p className="text-2xl font-bold text-slate-800">{group.averageScore.toFixed(1)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Improvement</p>
                            <p className="text-2xl font-bold text-green-600">+{group.improvementRate.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Retention</p>
                            <p className="text-2xl font-bold text-purple-600">{group.avgRetentionScore?.toFixed(1) || '-'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Retention Rate</p>
                            <p className="text-2xl font-bold text-blue-600">{group.retentionRate.toFixed(1)}%</p>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-slate-400" />
                            Student Performance Details
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                    <tr>
                                        <th className="p-4">Student Name</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4 text-center">Pre-Test</th>
                                        <th className="p-4 text-center">Post-Test</th>
                                        <th className="p-4 text-center">Retention</th>
                                        <th className="p-4 text-center">Improvement</th>
                                        <th className="p-4 text-center">Retention Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {group.students && group.students.length > 0 ? (
                                        group.students.map((student) => (
                                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">{student.name}</td>
                                                <td className="p-4">{renderPerformanceBadge(student.performanceCategory)}</td>
                                                <td className="p-4 text-center font-mono text-slate-600">{student.pretestScore ?? '-'}</td>
                                                <td className="p-4 text-center">{renderScore(student.posttestScore)}</td>
                                                <td className="p-4 text-center">{renderScore(student.retentionScore)}</td>
                                                <td className="p-4 text-center">{renderRate(student.improvementRate)}</td>
                                                <td className="p-4 text-center">{renderRate(student.retentionRate)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-slate-500">
                                                No individual student data available for this group.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupDetailsModal;
