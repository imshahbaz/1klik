import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { strategyAPI } from '../services/api';
import { useAuth } from './AuthContext';

export interface Strategy {
  name: string;
  scanClause: string;
  active: boolean;
  successRate?: number;
}

interface StrategyContextType {
  strategies: Strategy[];
  fifteenMinuteStrategies: Strategy[];
  loadingStrategies: boolean;
  strategiesError: string | null;
  refreshStrategies: () => Promise<void>;
}

const StrategyContext = createContext<StrategyContextType | null>(null);

export const StrategyProvider = ({ children }: { children: ReactNode }) => {
  const { appLoading } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [fifteenMinuteStrategies, setFifteenMinuteStrategies] = useState<Strategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);
  const [hasLoadedStrategies, setHasLoadedStrategies] = useState(false);

  const fetchByTimeFrame = useCallback(async (timeFrame: 'DAILY' | 'FIFTEEN_MINUTE') => {
    const res = await strategyAPI.getStrategies(timeFrame);
    return res.data.data as Strategy[];
  }, []);

  const refreshStrategies = useCallback(async () => {
    setLoadingStrategies(true);
    setStrategiesError(null);
    try {
      const [daily, fifteenMinute] = await Promise.all([
        fetchByTimeFrame('DAILY'),
        fetchByTimeFrame('FIFTEEN_MINUTE'),
      ]);
      setStrategies(daily);
      setFifteenMinuteStrategies(fifteenMinute);
      setHasLoadedStrategies(true);
    } catch (err) {
      console.error('Failed to load strategies:', err);
      setStrategiesError('Failed to fetch strategies');
    } finally {
      setLoadingStrategies(false);
    }
  }, [fetchByTimeFrame]);

  useEffect(() => {
    if (!appLoading && !hasLoadedStrategies) {
      refreshStrategies();
    }
  }, [appLoading, hasLoadedStrategies, refreshStrategies]);

  const value = useMemo(() => ({
    strategies,
    fifteenMinuteStrategies,
    loadingStrategies,
    strategiesError,
    refreshStrategies,
  }), [strategies, fifteenMinuteStrategies, loadingStrategies, strategiesError, refreshStrategies]);

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
