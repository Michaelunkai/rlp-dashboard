import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 5000; // 5 seconds
const SYNC_ENDPOINT = '/api/sync';

export function useRlpState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const abortControllerRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchState = useCallback(async () => {
    // Create new AbortController for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(SYNC_ENDPOINT, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setState(data);
      setConnected(true);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was aborted (cleanup on unmount), do not update state
        return;
      }
      setConnected(false);
      setError(err.message || 'Failed to fetch RLP state');
    } finally {
      setLoading(false);
    }
  }, []);

  // POST new state to /api/sync
  const updateState = useCallback(async (newState) => {
    const controller = new AbortController();
    try {
      const response = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status} ${response.statusText}`);
      }

      const updated = await response.json();
      setState(updated);
      setConnected(true);
      setError(null);
      return updated;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setConnected(false);
        setError(err.message || 'Failed to update RLP state');
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchState();

    // Poll every 5 seconds
    intervalRef.current = setInterval(fetchState, POLL_INTERVAL);

    return () => {
      // Cleanup: abort any in-flight request and clear interval
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchState]);

  return { state, loading, error, updateState, connected };
}

export default useRlpState;
