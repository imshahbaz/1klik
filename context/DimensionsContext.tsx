import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';

interface DimensionsContextData {
  width: number;
  height: number;
}

const DimensionsContext = createContext<DimensionsContextData | null>(null);

export const DimensionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use synchronous initial dimensions to avoid a flash of 0 width/height on first mount
  const [dimensions, setDimensions] = useState<DimensionsContextData>(() => {
    const window = Dimensions.get('window');
    return { width: window.width, height: window.height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    return () => subscription.remove();
  }, []);

  // Memoize context value so that the reference is stable unless dimensions change
  const value = useMemo(() => ({
    width: dimensions.width,
    height: dimensions.height,
  }), [dimensions.width, dimensions.height]);

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

