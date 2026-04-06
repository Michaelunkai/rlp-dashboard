import React, { createContext, useContext, useState, useCallback } from 'react';

const RlpContext = createContext(null);

export function RlpProvider({ children }) {
  const [rlpState, setRlpState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateState = useCallback((updates) => {
    setRlpState((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const value = {
    rlpState,
    loading,
    error,
    setLoading,
    setError,
    updateState,
  };

  return <RlpContext.Provider value={value}>{children}</RlpContext.Provider>;
}

export function useRlp() {
  const ctx = useContext(RlpContext);
  if (!ctx) {
    throw new Error('useRlp must be used within RlpProvider');
  }
  return ctx;
}

export default RlpContext;
