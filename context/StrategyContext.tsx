import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { strategyAPI } from '../services/api';
import { useAuth } from './AuthContext';

export interface Strategy {
  name: string;
  scanClause: string;
  active: boolean;
}

interface StrategyContextType {
  strategies: Strategy[];
  loadingStrategies: boolean;
  strategiesError: string | null;
  refreshStrategies: () => Promise<void>;
}

const StrategyContext = createContext<StrategyContextType | null>(null);

export const StrategyProvider = ({ children }: { children: ReactNode }) => {
  const { appLoading } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);
  const [hasLoadedStrategies, setHasLoadedStrategies] = useState(false);

  const refreshStrategies = useCallback(async () => {
    setLoadingStrategies(true);
    setStrategiesError(null);
    try {
      const res = await strategyAPI.getStrategies();
      const payload = res.data?.data || res.data;
      if (Array.isArray(payload)) {
        setStrategies(payload);
        setHasLoadedStrategies(true);
      } else {
        setStrategiesError('Invalid response structure');
      }
    } catch (err) {
      console.error('Failed to load strategies:', err);
      setStrategiesError('Failed to fetch strategies');
    } finally {
      setLoadingStrategies(false);
    }
  }, []);

  useEffect(() => {
    if (!appLoading && !hasLoadedStrategies) {
      refreshStrategies();
    }
  }, [appLoading, hasLoadedStrategies, refreshStrategies]);

  const value = useMemo(() => ({
    strategies,
    loadingStrategies,
    strategiesError,
    refreshStrategies,
  }), [strategies, loadingStrategies, strategiesError, refreshStrategies]);

  return (
    <StrategyContext.Provider value={value}>
      {children}
    </StrategyContext.Provider>
  );
};

export const useStrategies = (): StrategyContextType => {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error('useStrategies must be used within a StrategyProvider');
  }
  return context;
};
