import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, Colors } from '../theme/colors';

type ThemeContextType = {
  isDarkMode: boolean;
  theme: Colors;
  toggleTheme: (value?: boolean) => void;
};

const THEME_KEY = '@app_theme_mode';
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async (value?: boolean) => {
    try {
      const newValue = typeof value === 'boolean' ? value : !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const theme = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
