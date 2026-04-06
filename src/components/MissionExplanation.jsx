import { useState } from 'react';

/**
 * Renders basic markdown: bold (**text**), bullet lines (- item), newlines
 */
const renderMarkdown = (text) => {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const isBullet = /^(\s*[-*]\s+)/.test(line);
    const content = isBullet ? line.replace(/^\s*[-*]\s+/, '') : line;

    // Parse **bold** segments
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white/90">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc text-white/70 leading-relaxed">
          {rendered}
        </li>
      );
    }

    if (line.trim() === '') {
      return <div key={lineIdx} className="h-2" />;
    }

    return (
      <p key={lineIdx} className="text-white/70 leading-relaxed">
        {rendered}
      </p>
    );
  });
};

const MissionExplanation = ({ explanation, missionName }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!explanation) return;
    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = explanation;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!explanation) return null;

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white/40 text-xs uppercase tracking-wider font-medium select-none">
            Mission Details
          </span>
          {missionName && (
            <span className="text-white/30 text-xs truncate max-w-[180px]">
              — {missionName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy explanation to clipboard"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 select-none"
            style={{
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
              color: copied ? '#86efac' : 'rgba(255,255,255,0.5)',
              border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>

          {/* Toggle button */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 select-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.2s ease',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Expandable content */}
      <div
        style={{
          maxHeight: expanded ? '600px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="px-4 pb-4 pt-1 border-t border-white/5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
        >
          <div className="text-sm space-y-1">
            <ul className="space-y-1">
              {renderMarkdown(explanation)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionExplanation;
