import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mission color palette
const MISSION_COLORS = [
  { bg: '#6366f1', glow: '#6366f180', light: '#818cf8' }, // indigo
  { bg: '#22c55e', glow: '#22c55e80', light: '#4ade80' }, // green
  { bg: '#f59e0b', glow: '#f59e0b80', light: '#fbbf24' }, // amber
  { bg: '#ec4899', glow: '#ec489980', light: '#f472b6' }, // pink
  { bg: '#06b6d4', glow: '#06b6d480', light: '#22d3ee' }, // cyan
  { bg: '#8b5cf6', glow: '#8b5cf680', light: '#a78bfa' }, // violet
  { bg: '#ef4444', glow: '#ef444480', light: '#f87171' }, // red
  { bg: '#14b8a6', glow: '#14b8a680', light: '#2dd4bf' }, // teal
];

const extractMission = (text) => {
  const match = text && text.match(/--\s*Mission:\s*(.+)$/);
  return match ? match[1].trim() : 'General';
};

const Timeline = ({ todos = [], missions = [] }) => {
  const [visible, setVisible] = useState(false);

  // Build mission -> color index map
  const missionColorMap = useMemo(() => {
    const map = {};
    const allMissions = [
      ...new Set([
        ...missions.map((m) => (typeof m === 'string' ? m : m.name || m.title || String(m))),
        ...todos.map((t) => extractMission(t.text)),
      ]),
    ].filter(Boolean);
    allMissions.forEach((name, i) => {
      map[name] = MISSION_COLORS[i % MISSION_COLORS.length];
    });
    return map;
  }, [todos, missions]);

  // Filter done todos and sort by id (proxy for completion order)
  const doneTodos = useMemo(
    () =>
      todos
        .filter((t) => t.status === 'done')
        .sort((a, b) => (a.id || 0) - (b.id || 0)),
    [todos]
  );

  // Group done todos by mission
  const groups = useMemo(() => {
    const map = {};
    doneTodos.forEach((t) => {
      const mission = extractMission(t.text);
      if (!map[mission]) map[mission] = [];
      map[mission].push(t);
    });
    return Object.entries(map).map(([mission, items]) => ({
      mission,
      items,
      color: missionColorMap[mission] || MISSION_COLORS[0],
    }));
  }, [doneTodos, missionColorMap]);

  const totalDone = doneTodos.length;
  const totalTodos = todos.length;
  const maxId = Math.max(...todos.map((t) => t.id || 0), 1);

  if (totalDone === 0) return null;

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        onClick={() => setVisible((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        style={{
          background: visible ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: visible ? '#818cf8' : 'rgba(255,255,255,0.6)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: visible ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <rect x="1" y="4" width="14" height="2" rx="1" fill="currentColor" opacity="0.9" />
          <rect x="1" y="7.5" width="10" height="2" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="1" y="11" width="12" height="2" rx="1" fill="currentColor" opacity="0.4" />
        </svg>
        {visible ? 'Hide Timeline' : 'Show Timeline'}
        <span
          className="ml-1 px-1.5 py-0.5 rounded text-xs tabular-nums"
          style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
        >
          {totalDone}/{totalTodos}
        </span>
      </button>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-4 rounded-xl p-5"
              style={{
                background: 'rgba(15,15,30,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
                  Completion Timeline
                </h3>
                <span className="text-xs text-white/40">
                  ordered by todo ID (completion proxy)
                </span>
              </div>

              {/* Global progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-white/50 mb-1.5">
                  <span>Overall Progress</span>
                  <span className="tabular-nums">
                    {totalDone} / {totalTodos} done
                  </span>
                </div>
                <div
                  className="w-full h-3 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  {/* Segmented bar by mission */}
                  <div className="h-full flex" style={{ width: '100%' }}>
                    {groups.map(({ mission, items, color }) => {
                      const widthPct = (items.length / totalTodos) * 100;
                      return (
                        <motion.div
                          key={mission}
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                          title={`${mission}: ${items.length} done`}
                          style={{
                            background: color.bg,
                            boxShadow: `0 0 8px ${color.glow}`,
                            minWidth: widthPct > 0 ? '2px' : '0',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mission groups */}
              <div className="space-y-4">
                {groups.map(({ mission, items, color }, gi) => {
                  const missionTotal = todos.filter(
                    (t) => extractMission(t.text) === mission
                  ).length;
                  const pct = missionTotal > 0 ? Math.round((items.length / missionTotal) * 100) : 0;

                  return (
                    <motion.div
                      key={mission}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.05 + 0.2, duration: 0.3 }}
                    >
                      {/* Mission label row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              background: color.bg,
                              boxShadow: `0 0 6px ${color.glow}`,
                            }}
                          />
                          <span
                            className="text-xs font-medium truncate"
                            style={{ color: color.light, maxWidth: '220px' }}
                            title={mission}
                          >
                            {mission}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-xs tabular-nums" style={{ color: color.light }}>
                            {items.length}/{missionTotal}
                          </span>
                          <span
                            className="text-xs tabular-nums px-1.5 py-0.5 rounded"
                            style={{
                              background: `${color.bg}20`,
                              color: color.light,
                              border: `1px solid ${color.bg}40`,
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {/* Gantt-style bar row */}
                      <div
                        className="relative w-full h-8 rounded-lg overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        {/* Background grid lines */}
                        {[25, 50, 75].map((p) => (
                          <div
                            key={p}
                            className="absolute top-0 bottom-0 w-px"
                            style={{
                              left: `${p}%`,
                              background: 'rgba(255,255,255,0.06)',
                            }}
                          />
                        ))}

                        {/* Individual todo blocks */}
                        {items.map((todo, idx) => {
                          const leftPct = ((todo.id - 1) / maxId) * 100;
                          const blockW = Math.max((1 / maxId) * 100, 0.8);
                          return (
                            <motion.div
                              key={todo.id}
                              initial={{ opacity: 0, scaleY: 0 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              transition={{
                                delay: gi * 0.05 + idx * 0.02 + 0.3,
                                duration: 0.25,
                              }}
                              title={`#${todo.id}: ${todo.text ? todo.text.replace(/--.*$/, '').trim() : ''}`}
                              className="absolute top-1 bottom-1 rounded-sm cursor-pointer"
                              style={{
                                left: `${leftPct}%`,
                                width: `${blockW}%`,
                                minWidth: '6px',
                                background: color.bg,
                                boxShadow: `0 0 4px ${color.glow}`,
                                opacity: 0.85,
                              }}
                            />
                          );
                        })}

                        {/* Mission label overlay */}
                        <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                          <span
                            className="text-xs font-mono opacity-0 group-hover:opacity-100"
                            style={{ color: color.light }}
                          />
                        </div>
                      </div>

                      {/* Done todo ID chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {items.slice(0, 20).map((todo) => (
                          <span
                            key={todo.id}
                            className="text-xs tabular-nums px-1 py-0.5 rounded"
                            style={{
                              background: `${color.bg}18`,
                              color: color.light,
                              border: `1px solid ${color.bg}30`,
                              fontSize: '10px',
                            }}
                            title={todo.text ? todo.text.replace(/--.*$/, '').trim() : ''}
                          >
                            #{todo.id}
                          </span>
                        ))}
                        {items.length > 20 && (
                          <span
                            className="text-xs px-1 py-0.5 rounded"
                            style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}
                          >
                            +{items.length - 20} more
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex flex-wrap gap-3">
                  {groups.map(({ mission, color }) => (
                    <div key={mission} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: color.bg, boxShadow: `0 0 4px ${color.glow}` }}
                      />
                      <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '120px' }}>
                        {mission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timeline;
