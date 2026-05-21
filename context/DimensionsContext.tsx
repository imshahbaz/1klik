import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

interface DimensionsContextData {
  width: number;
  height: number;
}

const DimensionsContext = createContext<DimensionsContextData | null>(null);

export const DimensionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();

  return (
    <DimensionsContext.Provider value={{ width, height }}>
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
