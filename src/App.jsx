import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RlpProvider } from './contexts/RlpContext.jsx';

// Lazy-load page components (will be created in subsequent todos)
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').catch(() => ({
  default: () => (
    <div className="flex items-center justify-center h-full text-gray-400 text-lg">
      Dashboard loading...
    </div>
  ),
})));

// Placeholder components (Header and StatsBar will be created in subsequent todos)
function HeaderPlaceholder() {
  return (
    <header className="w-full bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <span className="text-xl font-bold text-white tracking-tight">RLP Dashboard</span>
      <span className="text-xs text-gray-500">v1.0</span>
    </header>
  );
}

function StatsBarPlaceholder() {
  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 px-6 py-2 flex gap-6 text-sm text-gray-400">
      <span>Stats loading...</span>
    </div>
  );
}

// Try to import real components if they exist
let Header = HeaderPlaceholder;
let StatsBar = StatsBarPlaceholder;

try {
  // Dynamic real imports handled via lazy when components are created
} catch {
  // Fallback to placeholders above
}

function App() {
  return (
    <RlpProvider>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Header />
        <StatsBar />
        <main className="flex-1 overflow-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64 text-gray-400">
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
                    404 — Page not found
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    </RlpProvider>
  );
}

export default App;
