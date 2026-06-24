import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { marginAPI } from '../services/api';
import { useAuth } from './AuthContext';

export interface MarginData {
  symbol: string;
  requiredMargin?: string | number;
  leverage?: string | number;
  price?: string | number;
  ltp?: string | number;
  [key: string]: any;
}

interface MarginContextType {
  margins: MarginData[];
  loadingMargins: boolean;
  refreshMargins: () => Promise<void>;
}

const MarginContext = createContext<MarginContextType | null>(null);

export const MarginProvider = ({ children }: { children: ReactNode }) => {
  const { appLoading } = useAuth();
  const [margins, setMargins] = useState<MarginData[]>([]);
  const [loadingMargins, setLoadingMargins] = useState(true);
  const [hasLoadedMargins, setHasLoadedMargins] = useState(false);

  const refreshMargins = useCallback(async () => {
    setLoadingMargins(true);
    try {
      const response = await marginAPI.getAllMargins();
      const data = response?.data?.data || response?.data || [];
      setMargins(Array.isArray(data) ? data : []);
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
