import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { userPreferenceAPI } from '../services/api';
import { Colors, darkColors, lightColors } from '../theme/colors';
import { useAuth } from './AuthContext';

type ThemeContextType = {
  isDarkMode: boolean;
  theme: Colors;
  toggleTheme: (value?: boolean) => void;
  themeLoaded: boolean;
};

const THEME_KEY = '@app_theme_mode';
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const { user, appLoading } = useAuth() as any;

  useEffect(() => {
    if (!appLoading) {
      const initTheme = async () => {
        if (user?.theme) {
          setIsDarkMode(user.theme === 'DARK');
          setThemeLoaded(true);
        } else if (!user) {
          try {
            const savedTheme = await AsyncStorage.getItem(THEME_KEY);
            if (savedTheme !== null) {
              setIsDarkMode(savedTheme === 'dark');
            } else {
              setIsDarkMode(systemColorScheme === 'dark');
            }
          } catch (e) {
            console.error('Failed to load theme preference', e);
          } finally {
            setThemeLoaded(true);
          }
        } else {
          setThemeLoaded(true);
        }
      };
      initTheme();
    }
  }, [user, appLoading, systemColorScheme]);

  const toggleTheme = async (value?: boolean) => {
    try {
      const newValue = typeof value === 'boolean' ? value : !isDarkMode;
      setIsDarkMode(newValue);

      // Save locally
      await AsyncStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light');

      // Sync to backend if user is logged in
      if (user) {
        const themeValue = newValue ? 'DARK' : 'LIGHT';
        await userPreferenceAPI.updateTheme(themeValue);
      }
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const theme = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme, themeLoaded }}>
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
