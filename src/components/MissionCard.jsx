import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MissionCard — glassmorphism card for a single mission group.
 *
 * Props:
 *   mission            {string}   Mission name / group label
 *   todos              {Array}    All todos belonging to this mission
 *   missionExplanation {string}   Long-form description of the mission goal
 */
export default function MissionCard({ mission, todos = [], missionExplanation = '' }) {
  const [expanded, setExpanded] = useState(false);

  // Derived counts
  const total   = todos.length;
  const done    = todos.filter((t) => t.status === 'done').length;
  const pending = total - done;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  // Progress bar colour: green when complete, amber when in-flight, blue otherwise
  const barColour =
    pct === 100
      ? 'from-emerald-400 to-green-500'
      : pct > 0
      ? 'from-amber-400 to-yellow-500'
      : 'from-sky-400 to-blue-500';

  return (
    <div
      className={[
        'relative overflow-hidden',
        'backdrop-blur-md bg-white/5',
        'border border-white/10 rounded-2xl',
        'transition-shadow duration-300',
        expanded ? 'shadow-2xl shadow-black/40' : 'shadow-lg shadow-black/20',
      ].join(' ')}
    >
      {/* ── Card Header ───────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 pt-5 pb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 rounded-2xl"
        aria-expanded={expanded}
      >
        {/* Mission name + chevron row */}
        <div className="flex items-center justify-between gap-3">
          {/* Gradient accent + name */}
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex-shrink-0 w-2.5 h-8 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500"
              aria-hidden="true"
            />
            <h2 className="text-base font-semibold text-white truncate leading-tight">
              {mission}
            </h2>
          </div>

          {/* Right side: badges + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Pending badge */}
            {pending > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-300 border border-sky-400/20">
                {pending} pending
              </span>
            )}
            {/* Done badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
              {done}/{total} done
            </span>

            {/* Animated chevron */}
            <motion.svg
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </motion.svg>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-medium text-gray-300">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${barColour}`}
            />
          </div>
        </div>
      </button>

      {/* ── Expanded Content ──────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/5 pt-3 space-y-4">
              {/* Mission explanation (if present) */}
              {missionExplanation && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 italic">
                  {missionExplanation.split('\n')[0]}
                </p>
              )}

              {/* Todo list */}
              {todos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No todos for this mission.</p>
              ) : (
                <ul className="space-y-2">
                  {todos.map((todo) => (
                    <TodoRow key={todo.id} todo={todo} />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Internal TodoRow ──────────────────────────────────────────── */
function TodoRow({ todo }) {
  const isDone       = todo.status === 'done';
  const isInProgress = todo.status === 'in_progress';

  const statusDot = isDone
    ? 'bg-emerald-400'
    : isInProgress
    ? 'bg-amber-400 animate-pulse'
    : 'bg-gray-600';

  // Strip mission suffix from display text  e.g. " -- Mission: X"
  const displayText = (todo.text || '').replace(/\s*--\s*Mission:.*$/i, '').trim();

  return (
    <li className="flex items-start gap-2.5 group">
      {/* Status dot */}
      <span
        className={`flex-shrink-0 mt-1.5 w-2 h-2 rounded-full ${statusDot}`}
        title={todo.status}
        aria-label={todo.status}
      />
      {/* Text */}
      <span
        className={[
          'text-sm leading-snug flex-1',
          isDone ? 'line-through text-gray-500' : 'text-gray-200',
        ].join(' ')}
      >
        {displayText || todo.text}
      </span>
      {/* ID chip */}
      <span className="flex-shrink-0 text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
        #{todo.id}
      </span>
    </li>
  );
}
