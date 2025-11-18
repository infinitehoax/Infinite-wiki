import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Menu, X, ArrowLeft, BookOpen } from 'lucide-react';

interface SidebarProps {
  history: HistoryItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNavigate: (topic: string) => void;
  currentTopic?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ history, isOpen, setIsOpen, onNavigate, currentTopic }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-xl lg:shadow-none lg:translate-x-0 lg:static lg:h-screen lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div 
                className="flex items-center gap-2 font-bold text-xl text-slate-800 cursor-pointer select-none"
                onClick={() => onNavigate('')} // Go home
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white">
                <span className="font-serif italic">W</span>
              </div>
              <span>Infinite Wiki</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Actions */}
          <div className="space-y-2 mb-8">
            <button 
              onClick={() => onNavigate('')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Search
            </button>
          </div>

          {/* History Section */}
          <div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
               <Clock size={12} />
               <span>Recent History</span>
             </div>
             
             {history.length === 0 ? (
               <div className="text-sm text-slate-400 italic px-3">No history yet</div>
             ) : (
               <div className="space-y-1">
                 {[...history].reverse().slice(0, 15).map((item) => (
                   <button
                     key={item.timestamp}
                     onClick={() => {
                       onNavigate(item.topic);
                       if (window.innerWidth < 1024) setIsOpen(false);
                     }}
                     className={`
                       w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate
                       ${currentTopic === item.topic 
                         ? 'bg-blue-50 text-blue-700 font-medium' 
                         : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                     `}
                   >
                     {item.topic}
                   </button>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
};