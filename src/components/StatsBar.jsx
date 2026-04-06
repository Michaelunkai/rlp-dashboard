import { useMemo } from 'react';

const formatTime = (minutes) => {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatTimestamp = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'N/A';
  }
};

const Chip = ({ label, value, color }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
    style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: color || 'rgba(255,255,255,0.9)',
    }}
  >
    <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>{label}</span>
    <span style={{ color: color || '#e2e8f0' }}>{value}</span>
  </span>
);

const StatsBar = ({ state }) => {
  const stats = useMemo(() => {
    const todos = state?.todos || [];
    const total = todos.length;
    const done = todos.filter((t) => t.status === 'done').length;
    const inProgress = todos.filter((t) => t.status === 'in_progress').length;
    const pending = todos.filter((t) => t.status === 'pending').length;
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;
    const estimatedMinutes = (pending + inProgress) * 5;
    return { total, done, inProgress, pending, completionPct, estimatedMinutes };
  }, [state]);

  const mode = state?.mode || 'rlp30';
  const lastUpdated = state?.updated || state?.created;

  const pctColor =
    stats.completionPct >= 70
      ? '#22c55e'
      : stats.completionPct >= 30
      ? '#eab308'
      : '#ef4444';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10, 10, 20, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2"
        style={{ maxWidth: '100%' }}
      >
        {/* Mode badge */}
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#818cf8',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#818cf8' }}
          />
          {mode}
        </span>

        <span
          className="hidden sm:block"
          style={{
            width: 1,
            height: 20,
            background: 'rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        />

        {/* Stats chips */}
        <Chip label="Total" value={stats.total} />
        <Chip label="Pending" value={stats.pending} color="#94a3b8" />
        <Chip
          label="In Progress"
          value={stats.inProgress}
          color="#fbbf24"
        />
        <Chip label="Done" value={stats.done} color="#4ade80" />

        <span
          className="hidden sm:block"
          style={{
            width: 1,
            height: 20,
            background: 'rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        />

        {/* Completion % */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: `${pctColor}18`,
            border: `1px solid ${pctColor}40`,
            color: pctColor,
          }}
        >
          {stats.completionPct}% Complete
        </span>

        {/* Estimated time remaining */}
        <Chip
          label="ETA"
          value={formatTime(stats.estimatedMinutes)}
          color="#7dd3fc"
        />

        {/* Spacer pushes timestamp to right on wide screens */}
        <div className="flex-1 hidden sm:block" />

        {/* Last updated */}
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Updated {formatTimestamp(lastUpdated)}
        </span>
      </div>
    </div>
  );
};

export default StatsBar;
