import React, { useState } from 'react';

export interface FeatureCardProps {
  icon: React.ReactNode;
  badge: string;
  badgeColor?: 'red' | 'emerald' | 'cyan' | 'purple' | 'amber';
  title: string;
  subtitle: string;
  summary: string;
  details: string[];
  codeSnippet?: {
    filename: string;
    language: string;
    code: string;
  };
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  badge,
  badgeColor = 'red',
  title,
  subtitle,
  summary,
  details,
  codeSnippet,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'red':
      default:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!codeSnippet) return;
    navigator.clipboard.writeText(codeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cyber-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
      <div>
        {/* Card Header: Icon & Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 group-hover:scale-105 transition-transform">
            {icon}
          </div>
          <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md border font-semibold ${getBadgeStyle()}`}>
            {badge}
          </span>
        </div>

        {/* Title and Subtitle */}
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-heading">
          {title}
        </h3>
        <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-wider">
          {subtitle}
        </p>

        {/* Summary */}
        <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
          {summary}
        </p>

        {/* Details bullets */}
        <ul className="mt-4 space-y-2 text-xs font-mono text-zinc-300">
          {details.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5 font-bold">›</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expandable Code Drawer */}
      {codeSnippet && (
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-90 text-red-400' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>{isExpanded ? 'Hide Protocol Spec' : 'Inspect Protocol Spec'}</span>
            </button>

            {isExpanded && (
              <button
                onClick={handleCopyCode}
                className="text-[11px] font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 bg-black/80 rounded-xl p-3 border border-zinc-800 text-[11px] font-mono overflow-x-auto code-scrollbar">
              <div className="text-zinc-500 text-[10px] pb-1.5 mb-1.5 border-b border-zinc-800/80 flex items-center justify-between">
                <span>{codeSnippet.filename}</span>
                <span className="text-zinc-600 uppercase">{codeSnippet.language}</span>
              </div>
              <pre className="text-zinc-300">
                <code>{codeSnippet.code}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
