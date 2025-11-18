import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, Shuffle, ExternalLink, AlertCircle } from 'lucide-react';
import { streamWikiPage, generateRandomTopic } from './services/geminiService';
import { WikiPageData, AppState, HistoryItem } from './types';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { WikiRenderer } from './components/WikiRenderer';

function App() {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [data, setData] = useState<WikiPageData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState<string>("");
  
  // Use a ref to track the current streaming topic to prevent race conditions
  const currentTopicRef = useRef<string>("");

  // Persist history to local storage
  useEffect(() => {
    const saved = localStorage.getItem('wiki-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wiki-history', JSON.stringify(history));
  }, [history]);

  const handleLoadTopic = useCallback(async (topic: string) => {
    if (!topic) {
      setState(AppState.HOME);
      setData(null);
      currentTopicRef.current = "";
      return;
    }

    const normalizedTopic = topic.trim();
    setLoadingTopic(normalizedTopic);
    currentTopicRef.current = normalizedTopic;
    
    setState(AppState.LOADING);
    setErrorMsg(null);
    setIsSidebarOpen(false); // close sidebar on mobile on selection

    // Initialize with empty content
    setData({ topic: normalizedTopic, content: '', sources: [] });

    try {
      const stream = streamWikiPage(normalizedTopic);
      let isFirstChunk = true;
      let finalContent = "";

      for await (const update of stream) {
        // If the user navigated away, stop updating
        if (currentTopicRef.current !== normalizedTopic) break;

        if (isFirstChunk) {
          setState(AppState.VIEWING);
          isFirstChunk = false;
        }

        finalContent = update.content;
        
        setData(prev => ({
          topic: normalizedTopic,
          content: update.content || prev?.content || '',
          sources: update.sources || prev?.sources || []
        }));
      }

      // Only update history if we finished successfully and are still on the same topic
      if (currentTopicRef.current === normalizedTopic) {
         setHistory(prev => {
          if (prev.length > 0 && prev[prev.length - 1].topic.toLowerCase() === normalizedTopic.toLowerCase()) {
            return prev;
          }
          // Keep last 50 items
          const newItem = { topic: normalizedTopic, timestamp: Date.now() };
          const newHistory = [...prev, newItem];
          return newHistory.slice(-50);
        });
      }

    } catch (err: any) {
      // Only show error if we are still trying to load this topic
      if (currentTopicRef.current === normalizedTopic) {
        console.error(err);
        setErrorMsg(err.message || "Failed to generate content. Please try again.");
        setState(AppState.ERROR);
      }
    } finally {
      if (currentTopicRef.current === normalizedTopic) {
         setLoadingTopic("");
      }
    }
  }, []);

  const handleRandom = async () => {
    setState(AppState.LOADING);
    setLoadingTopic("Picking a topic...");
    currentTopicRef.current = "Picking a topic...";
    try {
      const topic = await generateRandomTopic();
      // Check if we are still waiting for random topic and haven't navigated away
      if (currentTopicRef.current === "Picking a topic...") {
        handleLoadTopic(topic);
      }
    } catch (e) {
      handleLoadTopic("Serendipity");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar (Visible on Viewing/Loading/Error states if not mobile) */}
      <Sidebar 
        history={history}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onNavigate={handleLoadTopic}
        currentTopic={data?.topic}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header (Only visible when not in HOME state) */}
        {state !== AppState.HOME && (
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-4 shrink-0 sticky top-0 z-30">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 lg:hidden"
            >
              <Menu size={20} />
            </button>
            
            {/* Breadcrumb / Logo Area */}
            <div className="hidden lg:flex items-center gap-2 mr-4 cursor-pointer" onClick={() => handleLoadTopic('')}>
                 <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded text-white flex items-center justify-center text-xs font-serif italic">W</div>
            </div>

            <div className="flex-1 max-w-2xl">
              <SearchBar 
                onSearch={handleLoadTopic} 
                isCompact 
                initialValue={data?.topic || (state === AppState.LOADING ? loadingTopic : '')} 
              />
            </div>
            
            <button 
              onClick={handleRandom}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Random Article"
            >
              <Shuffle size={20} />
            </button>
          </header>
        )}

        {/* Main Scroll Area */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth" id="main-scroll">
          
          {/* HOME STATE */}
          {state === AppState.HOME && (
            <div className="min-h-full flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-2xl text-center space-y-8 -mt-20">
                <div className="space-y-2">
                   <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-blue-900/20 mb-6">
                     <span className="text-4xl font-serif italic text-white pt-1">W</span>
                   </div>
                   <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                    Infinite Wiki
                   </h1>
                   <p className="text-lg text-slate-500 max-w-lg mx-auto">
                     The encyclopedia that writes itself. Powered by AI, grounded in fact.
                   </p>
                </div>

                <div className="w-full">
                  <SearchBar onSearch={handleLoadTopic} className="max-w-xl mx-auto" />
                </div>
                
                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={handleRandom}
                    className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <Shuffle size={14} />
                    Surprise Me
                  </button>
                  {history.length > 0 && (
                    <button 
                      onClick={() => handleLoadTopic(history[history.length-1].topic)}
                      className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                    >
                      Resume Reading
                    </button>
                  )}
                </div>
              </div>
              
              <footer className="absolute bottom-6 text-slate-400 text-xs">
                Powered by Gemini 2.5 • Experimental AI Content
              </footer>
            </div>
          )}

          {/* LOADING STATE (Initial shimmer before first token) */}
          {state === AppState.LOADING && !data?.content && (
            <div className="max-w-4xl mx-auto px-6 py-12 w-full animate-pulse">
              <div className="h-10 bg-slate-200 rounded w-3/4 mb-6"></div>
              <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-8"></div>
              
              <div className="h-8 bg-slate-200 rounded w-1/2 mb-4 mt-12"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
              
              <div className="mt-12 flex items-center justify-center text-slate-400 gap-2">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Generating {loadingTopic}...</span>
              </div>
            </div>
          )}

          {/* VIEWING STATE (Streaming updates happen here too) */}
          {(state === AppState.VIEWING || (state === AppState.LOADING && data?.content)) && data && (
            <div className="max-w-4xl mx-auto px-6 py-12 min-h-full flex flex-col">
              
              <WikiRenderer content={data.content} onNavigate={handleLoadTopic} />
              
              {/* Sources / Grounding Footer */}
              {data.sources && data.sources.length > 0 && (
                <div className="mt-16 pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ExternalLink size={14} />
                    References & Sources
                  </h3>
                  <div className="grid gap-2">
                    {data.sources.map((source, idx) => (
                      <a 
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 -ml-2 rounded block truncate transition-colors"
                      >
                        <span className="font-medium text-slate-700 mr-2">[{idx + 1}]</span>
                        {source.title}
                        <span className="text-slate-400 ml-2 text-xs opacity-75 truncate">{source.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show loading spinner at bottom if still streaming (optional, but good for UX) */}
              {state === AppState.LOADING && (
                 <div className="mt-8 flex justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce mr-1"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce mr-1 delay-75"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                 </div>
              )}

              <div className="mt-12 text-center">
                <button 
                  onClick={handleRandom}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Read another article
                </button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {state === AppState.ERROR && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-slate-600 mb-6 max-w-md">{errorMsg}</p>
              <button 
                onClick={() => handleLoadTopic(loadingTopic || "")}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
}

export default App;