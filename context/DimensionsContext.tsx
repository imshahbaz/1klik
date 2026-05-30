import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

interface DimensionsContextData {
  width: number;
  height: number;
}

const DimensionsContext = createContext<DimensionsContextData | null>(null);

export const DimensionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();

  // Memoize context value so that the reference is stable unless dimensions change
  const value = useMemo(() => ({
    width,
    height,
  }), [width, height]);

  return (
    <DimensionsContext.Provider value={value}>
      {children}
    </DimensionsContext.Provider>
  );
};

export const useAppDimensions = () => {
  const context = useContext(DimensionsContext);
  if (!context) {
    throw new Error('useAppDimensions must be used within a DimensionsProvider');
  }
  return context;
};

