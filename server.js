const express = require('express');
const cors = require('cors');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const STATE_FILE = 'C:/Users/micha/.claude/workspace/rlp-state.json';
const REPO_DIR = path.join(__dirname);
const GITHUB_REPO = 'https://github.com/Michaelunkai/rlp-dashboard';
const PORT = 3001;
const CLOUDFLARED = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';

let tunnelUrl = '';
let githubSyncTimer = null;
let lastGitHash = '';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── State helpers ───────────────────────────────────────────────────────────
function readState() {
  try {
    let raw = fs.readFileSync(STATE_FILE, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch (e) { return { todos: [], missionExplanations: {} }; }
}

function writeState(data) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
  scheduleGitSync();
}

function extractMission(text) {
  const m = text && text.match(/[-\u2013]\s*Mission:\s*(.+?)$/i);
  if (m) return m[1].trim();
  const m2 = text && text.match(/Mission:\s*(.+)/i);
  return m2 ? m2[1].trim() : null;
}

// ─── WebSocket broadcast ─────────────────────────────────────────────────────
function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, ts: Date.now() });
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

// ─── File watcher ─────────────────────────────────────────────────────────────
chokidar.watch(STATE_FILE, { usePolling: true, interval: 400 }).on('change', () => {
  broadcast('state', readState());
  scheduleGitSync();
});

// ─── GitHub auto-sync (debounced 15s) ────────────────────────────────────────
function scheduleGitSync() {
  if (githubSyncTimer) clearTimeout(githubSyncTimer);
  githubSyncTimer = setTimeout(syncToGitHub, 15000);
}

function syncToGitHub() {
  try {
    const src = fs.readFileSync(STATE_FILE, 'utf8');
    const dest = path.join(REPO_DIR, 'rlp-state.json');
    fs.writeFileSync(dest, src, 'utf8');
    const cmd = `cd /d "${REPO_DIR}" && git add rlp-state.json tunnel-config.json && git commit -m "auto-sync state $(date /t)" && git push origin main`;
    exec(`cmd /c ${cmd}`, (err, stdout, stderr) => {
      if (!err) console.log('[git-sync] pushed rlp-state.json to GitHub');
      else console.log('[git-sync] skip (no change or error):', stderr.slice(0, 80));
    });
  } catch (e) { console.warn('[git-sync] error:', e.message); }
}

// ─── Cloudflared tunnel auto-start ───────────────────────────────────────────
function startTunnel() {
  if (!fs.existsSync(CLOUDFLARED)) { console.log('[tunnel] cloudflared not found'); return; }
  const cf = spawn(CLOUDFLARED, ['tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] });
  const capture = (data) => {
    const text = data.toString();
    const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m && !tunnelUrl) {
      tunnelUrl = m[0];
      console.log('[tunnel] URL:', tunnelUrl);
      saveTunnelConfig();
    }
  };
  cf.stdout.on('data', capture);
  cf.stderr.on('data', capture);
  cf.on('exit', (code) => {
    console.log('[tunnel] exited, restarting in 5s...');
    tunnelUrl = '';
    setTimeout(startTunnel, 5000);
  });
}

function saveTunnelConfig() {
  const cfg = { tunnelUrl, updatedAt: new Date().toISOString() };
  const cfgPath = path.join(REPO_DIR, 'tunnel-config.json');
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
  // Also expose in public/
  fs.writeFileSync(path.join(REPO_DIR, 'public', 'tunnel-config.json'), JSON.stringify(cfg, null, 2), 'utf8');
  // Push to GitHub immediately
  const cmd = `cd /d "${REPO_DIR}" && git add tunnel-config.json public/tunnel-config.json && git commit -m "update tunnel URL: ${tunnelUrl}" && git push origin main`;
  exec(`cmd /c ${cmd}`, (err) => {
    if (!err) console.log('[tunnel] config pushed to GitHub');
  });
  broadcast('config', cfg);
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Config
app.get('/api/config', (req, res) => {
  res.json({ tunnelUrl, githubRepo: GITHUB_REPO, port: PORT });
});

// State
app.get('/api/rlp-state', (req, res) => res.json(readState()));

// Mark todo status
app.post('/api/todo/mark', (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ error: 'id and status required' });
  const state = readState();
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  todo.status = status;
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true, todo });
});

// Cycle status: pending → in_progress → done → pending
app.post('/api/todo/cycle', (req, res) => {
  const { id } = req.body;
  const state = readState();
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  const cycle = { pending: 'in_progress', in_progress: 'done', done: 'pending' };
  todo.status = cycle[todo.status] || 'pending';
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true, todo });
});

// Update text
app.post('/api/todo/update-text', (req, res) => {
  const { id, text } = req.body;
  const state = readState();
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  todo.text = text;
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Add todo
app.post('/api/todo/add', (req, res) => {
  const { text, mission, status = 'pending', insertAfter } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const state = readState();
  const maxId = state.todos.reduce((m, t) => Math.max(m, t.id || 0), 0);
  const missionSuffix = mission ? ` - Mission: ${mission}` : '';
  const fullText = text.includes('Mission:') ? text : text + missionSuffix;
  const newTodo = { id: maxId + 1, text: fullText, status };
  if (insertAfter !== undefined) {
    const idx = state.todos.findIndex(t => t.id === insertAfter);
    state.todos.splice(idx + 1, 0, newTodo);
  } else {
    state.todos.push(newTodo);
  }
  if (mission && state.missionExplanations && !state.missionExplanations[mission]) {
    state.missionExplanations[mission] = `GOAL: ${mission}`;
  }
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true, todo: newTodo });
});

// Delete todo
app.post('/api/todo/delete', (req, res) => {
  const { id } = req.body;
  const state = readState();
  state.todos = state.todos.filter(t => t.id !== id);
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Reorder todos
app.post('/api/todo/reorder', (req, res) => {
  const { ids } = req.body;
  if (!ids) return res.status(400).json({ error: 'ids required' });
  const state = readState();
  const indexed = Object.fromEntries(state.todos.map(t => [t.id, t]));
  const reordered = ids.map(id => indexed[id]).filter(Boolean);
  const rest = state.todos.filter(t => !ids.includes(t.id));
  state.todos = [...reordered, ...rest];
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Move todo to different mission
app.post('/api/todo/move', (req, res) => {
  const { id, mission } = req.body;
  const state = readState();
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  // Update mission in text
  todo.text = todo.text.replace(/\s*[-\u2013]\s*Mission:\s*.+$/i, '') + ` - Mission: ${mission}`;
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Bulk operations
app.post('/api/todo/bulk', (req, res) => {
  const { ids, action, mission } = req.body;
  if (!ids || !action) return res.status(400).json({ error: 'ids and action required' });
  const state = readState();
  if (action === 'delete') {
    state.todos = state.todos.filter(t => !ids.includes(t.id));
  } else if (action === 'done' || action === 'pending' || action === 'in_progress') {
    state.todos.forEach(t => { if (ids.includes(t.id)) t.status = action; });
  } else if (action === 'move' && mission) {
    state.todos.forEach(t => {
      if (ids.includes(t.id)) {
        t.text = t.text.replace(/\s*[-\u2013]\s*Mission:\s*.+$/i, '') + ` - Mission: ${mission}`;
      }
    });
  }
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Mission: add
app.post('/api/mission/add', (req, res) => {
  const { name, goal = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const state = readState();
  if (!state.missionExplanations) state.missionExplanations = {};
  state.missionExplanations[name] = goal || `GOAL: ${name}`;
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Mission: rename
app.post('/api/mission/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'oldName and newName required' });
  const state = readState();
  // Update missionExplanations
  if (state.missionExplanations && state.missionExplanations[oldName]) {
    state.missionExplanations[newName] = state.missionExplanations[oldName];
    delete state.missionExplanations[oldName];
  }
  // Update todos
  state.todos.forEach(t => {
    t.text = t.text.replace(new RegExp(`Mission:\\s*${oldName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'i'), `Mission: ${newName}`);
  });
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Mission: delete
app.post('/api/mission/delete', (req, res) => {
  const { name, deleteTodos = false } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const state = readState();
  if (state.missionExplanations) delete state.missionExplanations[name];
  if (deleteTodos) {
    state.todos = state.todos.filter(t => extractMission(t.text) !== name);
  }
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Mission: reorder
app.post('/api/mission/reorder', (req, res) => {
  const { names } = req.body; // ordered mission names
  if (!names) return res.status(400).json({ error: 'names required' });
  const state = readState();
  // Reorder missionExplanations
  if (state.missionExplanations) {
    const newExp = {};
    names.forEach(n => { if (state.missionExplanations[n]) newExp[n] = state.missionExplanations[n]; });
    Object.keys(state.missionExplanations).forEach(k => { if (!newExp[k]) newExp[k] = state.missionExplanations[k]; });
    state.missionExplanations = newExp;
  }
  // Reorder todos by mission order
  const missionOrder = Object.fromEntries(names.map((n, i) => [n, i]));
  state.todos.sort((a, b) => {
    const ma = extractMission(a.text) || 'zz';
    const mb = extractMission(b.text) || 'zz';
    const ia = missionOrder[ma] ?? 999;
    const ib = missionOrder[mb] ?? 999;
    return ia - ib;
  });
  writeState(state);
  broadcast('state', state);
  res.json({ ok: true });
});

// Stats
app.get('/api/stats', (req, res) => {
  const state = readState();
  const todos = state.todos || [];
  const total = todos.length;
  const done = todos.filter(t => t.status === 'done').length;
  const inProgress = todos.filter(t => t.status === 'in_progress').length;
  const pending = todos.filter(t => t.status === 'pending').length;
  const missions = {};
  todos.forEach(t => {
    const m = extractMission(t.text) || 'General';
    if (!missions[m]) missions[m] = { total: 0, done: 0, inProgress: 0, pending: 0 };
    missions[m].total++;
    missions[m][t.status === 'in_progress' ? 'inProgress' : t.status]++;
  });
  res.json({ total, done, inProgress, pending, pct: total ? Math.round(done / total * 100) : 0, missions });
});

// GitHub manual sync
app.post('/api/github/sync', (req, res) => {
  syncToGitHub();
  res.json({ ok: true, message: 'Sync scheduled' });
});

// OpenClaw proxy
app.get('/api/openclaw/status', (req, res) => {
  const req2 = http.get('http://localhost:18789/status', (r) => {
    let data = '';
    r.on('data', d => data += d);
    r.on('end', () => { try { res.json(JSON.parse(data)); } catch (e) { res.json({ raw: data }); } });
  });
  req2.on('error', () => res.json({ status: 'offline' }));
  req2.setTimeout(2000, () => { req2.destroy(); res.json({ status: 'offline', error: 'timeout' }); });
});

// ─── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', data: readState(), ts: Date.now() }));
  ws.send(JSON.stringify({ type: 'config', data: { tunnelUrl, githubRepo: GITHUB_REPO }, ts: Date.now() }));
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`RLP Dashboard running on http://localhost:${PORT}`);
  startTunnel();
});
