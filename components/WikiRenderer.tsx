import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface WikiRendererProps {
  content: string;
  onNavigate: (topic: string) => void;
}

export const WikiRenderer: React.FC<WikiRendererProps> = ({ content, onNavigate }) => {
  
  // Pre-process content to transform [[WikiLink]] into standard markdown links [WikiLink](#wiki/WikiLink)
  // This makes it easier for ReactMarkdown to parse them as links.
  // We MUST encodeURIComponent the URL part to ensure spaces don't break the Markdown parser.
  const processedContent = useMemo(() => {
    return content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
      return `[${p1}](#wiki/${encodeURIComponent(p1)})`;
    });
  }, [content]);

  return (
    <div className="wiki-content prose prose-slate max-w-none prose-headings:font-sans prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown
        components={{
          a: ({ href, children, ...props }) => {
            const isWikiLink = href?.startsWith('#wiki/');
            
            if (isWikiLink && href) {
              const topic = decodeURIComponent(href.replace('#wiki/', ''));
              return (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(topic);
                  }}
                  className="text-blue-600 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer inline text-left"
                  title={`Go to ${topic}`}
                >
                  {children}
                </button>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline external-link"
                {...props}
              >
                {children}
                <span className="inline-block ml-0.5 text-slate-400 opacity-50" aria-hidden="true">↗</span>
              </a>
            );
          },
          h1: ({children}) => <h1 className="text-4xl font-serif border-b pb-4 mb-6 text-slate-900">{children}</h1>,
          h2: ({children}) => <h2 className="text-2xl font-serif border-b pb-2 mt-8 mb-4 text-slate-800">{children}</h2>,
          h3: ({children}) => <h3 className="text-xl font-bold mt-6 mb-3 text-slate-800">{children}</h3>,
          p: ({children}) => <p className="mb-4 leading-relaxed text-slate-800 text-lg">{children}</p>,
          ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600 bg-slate-50 py-2">{children}</blockquote>
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};