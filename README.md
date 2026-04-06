# RLP Mission Control Dashboard

**Live Demo:** [https://rlp-dashboard-live.netlify.app](https://rlp-dashboard-live.netlify.app)

A real-time, offline-first todo/mission management web app built for the **RLP (Ralph Loop Plus)** automation system. Manage missions, track todos, and monitor progress from anywhere -- with live sync to a local Claude Code workspace via WebSocket, Cloudflare Tunnel, and GitHub auto-push.

---

## Features

### Mission Management
- **Multi-mission support** -- organize todos under named missions with dedicated explanations/goals
- **Mission CRUD** -- create, rename, delete missions; optionally cascade-delete all associated todos
- **Mission reorder** -- drag-and-drop missions to reprioritize; todos reorder automatically
- **Mission cards** -- collapsible cards with per-mission progress rings and stats

### Todo Operations
- **Add todos** -- modal with mission selector, text input, and insert position (top / bottom / after specific ID)
- **Status cycling** -- click to cycle: `pending` -> `in_progress` -> `done` -> `pending`
- **Inline text editing** -- double-click any todo to edit its text in-place
- **Drag-and-drop reorder** -- powered by `@dnd-kit/core` + `@dnd-kit/sortable`
- **Bulk operations** -- select multiple todos and bulk mark done/pending, move to another mission, or delete
- **Move between missions** -- reassign any todo to a different mission

### Real-Time Sync
- **WebSocket live updates** -- local Express server watches `rlp-state.json` via `chokidar` and broadcasts changes to all connected clients instantly
- **Cloudflare Tunnel** -- auto-starts `cloudflared` to expose the local server with a public HTTPS URL, enabling access from any device
- **GitHub auto-sync** -- debounced (15s) auto-commit and push of state changes to this repo
- **Netlify Functions** -- serverless `sync` and `heartbeat` endpoints using Netlify Blobs for cloud state persistence
- **Offline-first PWA** -- service worker caches the app shell; works offline and syncs when back online
- **Polling fallback** -- 5-second polling to `/api/sync` when WebSocket is unavailable

### UI/UX
- **Dark glassmorphism theme** -- custom CSS variables, backdrop blur, gradient backgrounds, glow effects
- **Framer Motion animations** -- page transitions, staggered list animations, card hover effects, drag overlays
- **Progress rings** -- SVG circular progress indicators per mission and overall
- **Stats bar** -- real-time counters for total/done/in-progress/pending todos with percentage
- **Responsive design** -- works on desktop and mobile
- **Custom scrollbar** -- themed scrollbar matching the dark UI
- **Skeleton loaders** -- shimmer placeholders while data loads
- **Keyboard shortcuts** -- Escape to close modals

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, JSX |
| **Styling** | Tailwind CSS 3.4, PostCSS, Autoprefixer, custom CSS variables |
| **Animations** | Framer Motion 11 |
| **Drag & Drop** | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| **Routing** | React Router DOM 6 |
| **State Management** | React Context API + custom hooks |
| **Local Server** | Express 5, WebSocket (ws), chokidar file watcher |
| **Tunnel** | Cloudflare Tunnel (cloudflared) |
| **Deployment** | Netlify (static site + serverless functions) |
| **Serverless** | Netlify Functions (esbuild bundler), Netlify Blobs |
| **PWA** | Service worker, Web App Manifest |
| **Version Control** | Git auto-sync to GitHub |

---

## Architecture

```
+---------------------+       WebSocket        +--------------------+
|   Browser (React)   | <--------------------> |  Local Express     |
|   Vite SPA          |                        |  Server (port 3001)|
+---------------------+                        +--------------------+
         |                                              |
         |  HTTPS (Cloudflare Tunnel)                   |  chokidar watch
         |                                              |
         v                                              v
+---------------------+                        +--------------------+
| Netlify (static +   |                        | rlp-state.json     |
| serverless funcs)   |                        | (local workspace)  |
+---------------------+                        +--------------------+
         |                                              |
         |  Netlify Blobs                               |  git auto-push
         v                                              v
+---------------------+                        +--------------------+
| Cloud State Store   |                        | GitHub Repository  |
+---------------------+                        +--------------------+
```

**Data Flow:**
1. Claude Code RLP system writes to `rlp-state.json` locally
2. `chokidar` detects the change and broadcasts via WebSocket to all connected dashboards
3. State is auto-committed and pushed to GitHub every 15 seconds (debounced)
4. Netlify Functions provide a serverless sync endpoint for when the local server is offline
5. The PWA service worker caches the app for offline access

---

## Project Structure

```
rlp-dashboard/
├── index.html                    # Vite entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite configuration (port 3000, React plugin)
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS with Tailwind + Autoprefixer
├── netlify.toml                  # Netlify build config + redirects + functions
├── server.js                     # Express + WebSocket + chokidar + cloudflared + GitHub sync
├── tunnel-config.json            # Current Cloudflare Tunnel URL
├── netlify/
│   └── functions/
│       ├── heartbeat.js          # Connection status serverless endpoint
│       └── sync.js               # State read/write via Netlify Blobs
├── public/
│   ├── index.html                # Static fallback
│   ├── manifest.json             # PWA manifest
│   ├── rlp-state.json            # Synced state snapshot
│   ├── sw.js                     # Service worker (offline-first caching)
│   └── tunnel-config.json        # Public tunnel config
└── src/
    ├── main.jsx                  # React entry + BrowserRouter
    ├── App.jsx                   # Root layout + routes + providers
    ├── index.css                 # Tailwind directives + dark theme + glassmorphism + animations
    ├── contexts/
    │   └── RlpContext.jsx        # React Context for global RLP state
    ├── hooks/
    │   ├── useRlpState.js        # Polling hook for /api/sync (5s interval)
    │   └── useWebSocket.js       # Heartbeat polling hook (10s interval)
    ├── components/
    │   ├── AddTodoModal.jsx      # Modal for adding new todos with mission/position selection
    │   ├── Header.jsx            # App header with branding and connection status
    │   ├── MissionCard.jsx       # Collapsible mission card with progress ring + todo list
    │   ├── MissionExplanation.jsx # Mission goal/description display
    │   ├── ProgressRing.jsx      # SVG circular progress indicator
    │   ├── StatsBar.jsx          # Real-time stats counters (total/done/in-progress/pending)
    │   ├── Timeline.jsx          # Timeline view of todo activity
    │   ├── TodoItem.jsx          # Individual todo with status cycling, inline edit, drag handle
    │   └── TodoList.jsx          # Sortable todo list with drag-and-drop
    └── utils/
        └── animations.js         # Framer Motion variants and transitions
```

---

## API Endpoints

### Local Server (Express, port 3001)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/config` | Server config (tunnel URL, GitHub repo, port) |
| `GET` | `/api/rlp-state` | Current full RLP state |
| `GET` | `/api/stats` | Aggregated stats (total, done, in-progress, pending, per-mission) |
| `POST` | `/api/todo/mark` | Set todo status (`{ id, status }`) |
| `POST` | `/api/todo/cycle` | Cycle status: pending -> in_progress -> done -> pending |
| `POST` | `/api/todo/update-text` | Update todo text (`{ id, text }`) |
| `POST` | `/api/todo/add` | Add new todo (`{ text, mission, status, insertAfter }`) |
| `POST` | `/api/todo/delete` | Delete todo (`{ id }`) |
| `POST` | `/api/todo/reorder` | Reorder todos (`{ ids }`) |
| `POST` | `/api/todo/move` | Move todo to different mission (`{ id, mission }`) |
| `POST` | `/api/todo/bulk` | Bulk operations (`{ ids, action, mission }`) |
| `POST` | `/api/mission/add` | Create mission (`{ name, goal }`) |
| `POST` | `/api/mission/rename` | Rename mission (`{ oldName, newName }`) |
| `POST` | `/api/mission/delete` | Delete mission (`{ name, deleteTodos }`) |
| `POST` | `/api/mission/reorder` | Reorder missions (`{ names }`) |
| `POST` | `/api/github/sync` | Trigger manual GitHub sync |
| `GET` | `/api/openclaw/status` | Proxy to local OpenClaw status |

### WebSocket (port 3001)

On connect, the server sends:
- `{ type: "state", data: <full state> }`
- `{ type: "config", data: { tunnelUrl, githubRepo } }`

On file change, broadcasts:
- `{ type: "state", data: <updated state> }`

### Netlify Serverless Functions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/.netlify/functions/sync` | Read state from Netlify Blobs |
| `POST` | `/.netlify/functions/sync` | Write state to Netlify Blobs |
| `GET` | `/.netlify/functions/heartbeat` | Connection status + last sync timestamp |

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Cloudflare Tunnel** (`cloudflared`) -- optional, for remote access

### Installation

```bash
git clone https://github.com/Michaelunkai/rlp-dashboard.git
cd rlp-dashboard
npm install
```

### Development (Frontend Only)

```bash
npm run dev
```

Opens the Vite dev server at `http://localhost:3000` with hot module replacement.

### Full Stack (Local Server + Tunnel)

```bash
npm start
```

Starts the Express server on port 3001 with:
- WebSocket for real-time state broadcasting
- File watcher on `rlp-state.json`
- Cloudflare Tunnel auto-start (if `cloudflared` is installed)
- GitHub auto-sync (15s debounced)

### Build for Production

```bash
npm run build
```

Outputs optimized static files to `dist/`. Netlify auto-deploys from this directory.

---

## Deployment

The app is deployed on **Netlify** with the following configuration:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`
- **SPA redirects:** All routes redirect to `/index.html` (status 200)
- **Live URL:** [https://rlp-dashboard-live.netlify.app](https://rlp-dashboard-live.netlify.app)

---

## State Format

The `rlp-state.json` file follows this structure:

```json
{
  "mode": "rlp30",
  "total": 60,
  "created": "2026-04-06T12:00:00Z",
  "task": "Mission description...",
  "workingDir": "F:\\Downloads",
  "context": "Project context...",
  "missionExplanations": {
    "Mission Name": "GOAL: Description of the mission goal..."
  },
  "todos": [
    {
      "id": 1,
      "text": "Todo description - Mission: Mission Name",
      "status": "pending"
    }
  ]
}
```

**Todo statuses:** `pending`, `in_progress`, `done`

---

## PWA Support

The app is a Progressive Web App with:
- **Service worker** (`public/sw.js`) -- cache-first strategy for static assets, network-first for API calls
- **Web App Manifest** -- installable on mobile/desktop with standalone display mode
- **Offline support** -- cached app shell works without network; API calls gracefully degrade to `{}`

---

## License

MIT
