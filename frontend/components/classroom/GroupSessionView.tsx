import React, { useState, useEffect } from 'react';
import { ClassDetails, EnrolledStudent } from '../../types';
import { Users } from 'lucide-react';
import Chat from './Chat';
import SharedNotes from './SharedNotes';
import AIAssistant from './AIAssistant';

const GroupSessionView: React.FC<{ classDetails: ClassDetails; student: EnrolledStudent }> = ({ classDetails, student }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'ai'>('chat');
  
  if (!student.groupNumber) {
    return <div className="flex-grow flex items-center justify-center text-center p-8 bg-white rounded-lg shadow-md">
        <div>
            <h2 className="text-2xl font-bold text-slate-700">Waiting for Group Assignment</h2>
            <p className="text-slate-500 mt-2">Your teacher has not assigned you to a group yet. Please wait.</p>
        </div>
    </div>;
  }
  
  const groupMembers = classDetails.students.filter(s => s.groupNumber === student.groupNumber);

  return (
    <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 h-full p-4">
      {/* Left Panel: Group Members List (Sidebar) */}
      <div className="lg:col-span-1 flex flex-col gap-4 h-full order-2 lg:order-1">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4">
            <Users size={24} className="text-teal-600" />
            Group Members
          </h2>
          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            {groupMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200 group">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg group-hover:bg-teal-200 transition-colors">
                    {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-700 font-semibold">{member.name}</span>
                    <span className="text-xs text-slate-500">Student</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-6 text-center text-xs text-slate-400">
             Group {student.groupNumber}
          </div>
        </div>
      </div>

      {/* Right Panel: Tabbed Interface for Chat, Notes, AI (Main Content) */}
      <div className="lg:col-span-3 flex flex-col h-[calc(100vh-140px)] order-1 lg:order-2">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button 
                onClick={() => setActiveTab('notes')} 
                className={`flex-1 py-4 px-6 font-semibold text-sm tracking-wide transition-all duration-200 ${activeTab === 'notes' ? 'bg-white border-t-2 border-t-teal-600 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
                Shared Notes
            </button>
            <button 
                onClick={() => setActiveTab('chat')} 
                className={`flex-1 py-4 px-6 font-semibold text-sm tracking-wide transition-all duration-200 ${activeTab === 'chat' ? 'bg-white border-t-2 border-t-teal-600 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
                Group Chat
            </button>
            <button 
                onClick={() => setActiveTab('ai')} 
                className={`flex-1 py-4 px-6 font-semibold text-sm tracking-wide transition-all duration-200 ${activeTab === 'ai' ? 'bg-white border-t-2 border-t-teal-600 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
                AI Assistant
            </button>
          </div>
          <div className="flex-grow flex flex-col overflow-hidden bg-white relative">
            {activeTab === 'chat' && (
                <div className="absolute inset-0 flex flex-col animate-in fade-in duration-300">
                    <Chat isAIAssistant={false} classId={classDetails.id} groupId={student.groupNumber} key={`chat-${student.groupNumber}`} />
                </div>
            )}
            {activeTab === 'notes' && (
                <div className="absolute inset-0 flex flex-col animate-in fade-in duration-300">
                    <SharedNotes classId={classDetails.id} groupId={student.groupNumber} key={`notes-${student.groupNumber}`} />
                </div>
            )}
            {activeTab === 'ai' && (
                <div className="absolute inset-0 flex flex-col animate-in fade-in duration-300">
                    <AIAssistant key={`ai-${student.groupNumber}`} classId={classDetails.id} groupId={student.groupNumber} />
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSessionView;