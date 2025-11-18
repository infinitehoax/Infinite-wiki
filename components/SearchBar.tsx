import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Command } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isCompact?: boolean;
  initialValue?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isCompact = false, initialValue = '', className = '' }) => {
  const [query, setQuery] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  // Focus shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`relative group transition-all duration-300 ${className}`}
    >
      <div className={`
        relative flex items-center bg-white border-2 transition-all duration-200 ease-out overflow-hidden
        ${isCompact 
          ? 'rounded-full border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 h-10 shadow-sm' 
          : 'rounded-2xl border-slate-200 focus-within:border-blue-500 focus-within:shadow-xl focus-within:scale-[1.01] h-14 shadow-md'}
      `}>
        <div className={`flex items-center justify-center text-slate-400 ${isCompact ? 'pl-3' : 'pl-5'}`}>
          <Search size={isCompact ? 18 : 22} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isCompact ? "Search..." : "What do you want to learn about?"}
          className={`
            w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400
            ${isCompact ? 'px-3 text-sm' : 'px-4 text-lg'}
          `}
          autoFocus={!isCompact}
        />

        {/* Right side icons */}
        <div className={`flex items-center pr-2 gap-2 ${isCompact ? '' : 'pr-4'}`}>
          {!isCompact && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200">
              <Command size={10} />
              <span>K</span>
            </div>
          )}
          <button 
            type="submit"
            className={`
              flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors
              ${isCompact ? 'w-7 h-7' : 'w-10 h-10'}
            `}
            aria-label="Search"
          >
             <Sparkles size={isCompact ? 14 : 18} />
          </button>
        </div>
      </div>
    </form>
  );
};