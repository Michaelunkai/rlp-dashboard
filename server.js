const express = require('express');
const cors = require('cors');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const STATE_FILE = 'C:/Users/micha/.claude/workspace/rlp-state.json';
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readState() {
  try {
    let raw = fs.readFileSync(STATE_FILE, 'utf8');
    // Strip BOM if present
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch (e) {
    return { todos: [] };
  }
}

function writeState(data) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Watch state file and broadcast on change
chokidar.watch(STATE_FILE, { usePolling: true, interval: 500 }).on('change', () => {
  broadcast({ type: 'state', data: readState() });
});

// GET /api/rlp-state
app.get('/api/rlp-state', (req, res) => {
  res.json(readState());
});

// POST /api/rlp-state/todo/reorder
app.post('/api/rlp-state/todo/reorder', (req, res) => {
  const { ids } = req.body; // ordered array of todo IDs
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
  const state = readState();
  const indexed = {};
  state.todos.forEach(t => { indexed[t.id] = t; });
  // Build new ordered list: reordered ids first, then any not in list
  const reordered = ids.map(id => indexed[id]).filter(Boolean);
  const rest = state.todos.filter(t => !ids.includes(t.id));
  state.todos = [...reordered, ...rest];
  writeState(state);
  res.json({ ok: true });
});

// POST /api/rlp-state/todo/update-text
app.post('/api/rlp-state/todo/update-text', (req, res) => {
  const { id, text } = req.body;
  const state = readState();
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  todo.text = text;
  writeState(state);
  res.json({ ok: true });
});

// POST /api/rlp-state/todo/delete
app.post('/api/rlp-state/todo/delete', (req, res) => {
  const { id } = req.body;
  const state = readState();
  state.todos = state.todos.filter(t => t.id !== id);
  writeState(state);
  res.json({ ok: true });
});

// POST /api/rlp-state/todo/add
app.post('/api/rlp-state/todo/add', (req, res) => {
  const { text, mission } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const state = readState();
  const maxId = state.todos.reduce((m, t) => Math.max(m, t.id || 0), 0);
  const newTodo = {
    id: maxId + 1,
    text: text,
    status: 'pending',
    mission: mission || 'General',
    created_at: new Date().toISOString()
  };
  state.todos.push(newTodo);
  writeState(state);
  res.json({ ok: true, todo: newTodo });
});

// GET /api/openclaw/status
app.get('/api/openclaw/status', (req, res) => {
  const http2 = require('http');
  const req2 = http2.get('http://localhost:18789/status', (r) => {
    let data = '';
    r.on('data', d => data += d);
    r.on('end', () => {
      try { res.json(JSON.parse(data)); } catch(e) { res.json({ raw: data }); }
    });
  });
  req2.on('error', () => res.json({ status: 'offline', error: 'Gateway unreachable' }));
  req2.setTimeout(2000, () => { req2.destroy(); res.json({ status: 'offline', error: 'timeout' }); });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', data: readState() }));
});

server.listen(PORT, () => {
  console.log('RLP Dashboard running on http://localhost:' + PORT);
});
