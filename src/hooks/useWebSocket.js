import { useState, useEffect, useRef } from 'react';

const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds
const HEARTBEAT_ENDPOINT = '/api/heartbeat';

/**
 * useWebSocket - Real-time connection status hook
 * Polls /api/heartbeat every 10 seconds to determine sync agent online status.
 *
 * @returns {{ isOnline: boolean, lastSeen: string|null, agentVersion: string|null }}
 */
export function useWebSocket() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [agentVersion, setAgentVersion] = useState(null);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  const ping = async () => {
    // Cancel any in-flight request before issuing a new one
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const response = await fetch(HEARTBEAT_ENDPOINT, {
        method: 'GET',
        signal: abortRef.current.signal,
        cache: 'no-store',
      });

      if (response.ok) {
        let data = {};
        try {
          data = await response.json();
        } catch {
          // heartbeat may return empty body — treat as online
        }

        setIsOnline(true);
        setLastSeen(data.timestamp ?? new Date().toISOString());
        setAgentVersion(data.version ?? data.agentVersion ?? null);
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Intentional abort — do not update state
        return;
      }
      // Network error or timeout — mark agent offline
      setIsOnline(false);
    }
  };

  useEffect(() => {
    // Fire immediately on mount, then repeat
    ping();
    intervalRef.current = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, lastSeen, agentVersion };
}

export default useWebSocket;
