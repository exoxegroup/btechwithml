import React, { useState } from 'react';
import { ClassDetails } from '../../types';
import Chat from './Chat';
import SharedNotes from './SharedNotes';

const TeacherGroupMonitorView: React.FC<{ classDetails: ClassDetails }> = ({ classDetails }) => {
  const groups = [...new Set(classDetails.students.map(s => s.groupNumber).filter(g => g !== null && g !== undefined))].sort((a,b) => a! - b!);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(groups[0] || null);

  if (selectedGroup === null) {
    return <div className="flex-grow flex items-center justify-center text-center p-8 bg-white rounded-lg shadow-md">
        <div>
            <h2 className="text-2xl font-bold text-slate-700">No Active Groups</h2>
            <p className="text-slate-500 mt-2">Students have not been assigned to groups, or groups have not been activated.</p>
        </div>
    </div>;
  }

  return (
    <div className="flex-grow flex flex-col gap-6 h-full p-4">
        {/* Header Section: Group Selection */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 whitespace-nowrap flex items-center gap-2">
                <span className="w-2 h-8 bg-teal-600 rounded-full"></span>
                Monitor Groups
            </h2>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 w-full custom-scrollbar">
                {groups.map(g => (
                    <button 
                        key={g} 
                        onClick={() => setSelectedGroup(g)}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm border ${
                            selectedGroup === g 
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                        Group {g}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content: Split View (Notes & Chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow h-[calc(100vh-200px)]">
            {/* Left Panel: Shared Notes (Focus Area) */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </span>
                        Shared Notes
                    </h3>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded">Read Only View</span>
                 </div>
                 <div className="flex-grow flex flex-col relative bg-white">
                     <SharedNotes classId={classDetails.id} groupId={selectedGroup} readOnly={true} key={`notes-monitor-${selectedGroup}`} />
                 </div>
            </div>

            {/* Right Panel: Chat (Context Area) */}
            <div className="lg:col-span-4 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 p-1.5 rounded-lg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </span>
                        Group Chat
                    </h3>
                </div>
                <div className="flex-grow flex flex-col overflow-hidden bg-white">
                    <Chat isAIAssistant={false} key={`chat-monitor-${selectedGroup}`} classId={classDetails.id} groupId={selectedGroup} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default TeacherGroupMonitorView;