import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { marginAPI } from '../services/api';
import type { Margin } from '../services/api';
import { useAuth } from './AuthContext';

interface MarginContextType {
  margins: Margin[];
  loadingMargins: boolean;
  refreshMargins: () => Promise<void>;
}

const MarginContext = createContext<MarginContextType | null>(null);

export const MarginProvider = ({ children }: { children: ReactNode }) => {
  const { appLoading } = useAuth();
  const [margins, setMargins] = useState<Margin[]>([]);
  const [loadingMargins, setLoadingMargins] = useState(true);
  const [hasLoadedMargins, setHasLoadedMargins] = useState(false);

  const refreshMargins = useCallback(async () => {
    setLoadingMargins(true);
    try {
      const response = await marginAPI.getAllMargins();
      setMargins(response.data.data);
      setHasLoadedMargins(true);
    } catch (err) {
      console.error('Error fetching margins:', err);
    } finally {
      setLoadingMargins(false);
    }
  }, []);

  useEffect(() => {
    if (!appLoading && !hasLoadedMargins) {
      refreshMargins();
    }
  }, [appLoading, hasLoadedMargins, refreshMargins]);

  const value = useMemo(() => ({
    margins,
    loadingMargins,
    refreshMargins,
  }), [margins, loadingMargins, refreshMargins]);

  return (
    <MarginContext.Provider value={value}>
      {children}
    </MarginContext.Provider>
  );
};

export const useMargins = (): MarginContextType => {
  const context = useContext(MarginContext);
  if (!context) {
    throw new Error('useMargins must be used within a MarginProvider');
  }
  return context;
};
