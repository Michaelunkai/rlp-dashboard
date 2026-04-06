import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { headerSlide } from '../utils/animations.js';

/**
 * ProgressRing — inline SVG circular progress indicator
 * @param {number} radius   - circle radius in px
 * @param {number} stroke   - stroke width in px
 * @param {number} progress - 0..100
 */
function ProgressRing({ radius = 20, stroke = 3, progress = 0 }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        stroke="rgba(255,255,255,0.15)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* Progress arc */}
      <circle
        stroke="url(#ringGradient)"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Header — RLP Mission Control top bar
 *
 * Props:
 *   state    {object}  — RLP state object { todos: [{status},...], ... }
 *   isOnline {boolean} — connection status
 *   lastSeen {Date|string|null} — timestamp of last successful sync
 */
export default function Header({ state, isOnline, lastSeen }) {
  // Derive progress from todos
  const { done, total, pct } = useMemo(() => {
    const todos = state?.todos ?? [];
    const total = todos.length;
    const done = todos.filter((t) => t.status === 'done').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [state]);

  // Format last sync timestamp
  const syncLabel = useMemo(() => {
    if (!lastSeen) return 'Never synced';
    const d = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [lastSeen]);

  return (
    <motion.header
      variants={headerSlide}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(10, 10, 20, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
      }}
    >
      <div className="mx-auto flex items-center justify-between px-6 py-3 max-w-screen-2xl">

        {/* ── Left: App title ── */}
        <div className="flex items-center gap-3">
          {/* Sigil icon */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1
            className="text-lg font-bold tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #a5b4fc 0%, #c4b5fd 50%, #e879f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            RLP Mission Control
          </h1>
        </div>

        {/* ── Center: Progress ring + fraction ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <ProgressRing radius={24} stroke={3} progress={pct} />
            {/* Percentage label in the center */}
            <span
              className="absolute text-[10px] font-semibold"
              style={{ color: '#c4b5fd' }}
            >
              {pct}%
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>
              {done} / {total}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              todos done
            </span>
          </div>
        </div>

        {/* ── Right: Connection + Last sync ── */}
        <div className="flex items-center gap-4">
          {/* Last sync */}
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Last Sync
            </span>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {syncLabel}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3 items-center justify-center">
              {isOnline ? (
                <>
                  {/* Pulsing ring for online */}
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{
                      background: '#22c55e',
                      animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
                    }}
                  />
                  <span
                    className="relative inline-flex h-3 w-3 rounded-full"
                    style={{ background: '#22c55e' }}
                  />
                </>
              ) : (
                <span
                  className="inline-flex h-3 w-3 rounded-full"
                  style={{ background: '#ef4444' }}
                />
              )}
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: isOnline ? '#86efac' : '#fca5a5' }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Keyframe for ping animation — injected once */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </header>
  );
}
