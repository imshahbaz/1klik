import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { userPreferenceAPI } from '../services/api';
import { MD3Theme } from 'react-native-paper';
import { Colors, darkColors, lightColors } from '../theme/colors';
import { paperLightTheme, paperDarkTheme } from '../theme/paperTheme';
import { useAuth } from './AuthContext';

type ThemeContextType = {
  isDarkMode: boolean;
  theme: Colors;
  paperTheme: MD3Theme;
  toggleTheme: (value?: boolean) => void;
  themeLoaded: boolean;
};

const THEME_KEY = '@app_theme_mode';
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const { user, appLoading } = useAuth();

  useEffect(() => {
    if (!appLoading) {
      const initTheme = async () => {
        if (user?.theme) {
          setIsDarkMode(user.theme === 'DARK');
          setThemeLoaded(true);
        } else if (user) {
          setThemeLoaded(true);
        } else {
          try {
            const savedTheme = await AsyncStorage.getItem(THEME_KEY);
            if (savedTheme === null) {
              setIsDarkMode(systemColorScheme === 'dark');
            } else {
              setIsDarkMode(savedTheme === 'dark');
            }
          } catch (e) {
            console.error('Failed to load theme preference', e);
          } finally {
            setThemeLoaded(true);
          }
        }
      };
      initTheme();
    }
  }, [user, appLoading, systemColorScheme]);

  const toggleTheme = useCallback(async (value?: boolean) => {
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
  }, [isDarkMode, user]);

  const theme = isDarkMode ? darkColors : lightColors;
  const paperTheme = isDarkMode ? paperDarkTheme : paperLightTheme;

  const value = useMemo(() => ({
    isDarkMode,
    theme,
    paperTheme,
    toggleTheme,
    themeLoaded
  }), [isDarkMode, theme, paperTheme, toggleTheme, themeLoaded]);

  return (
    <ThemeContext.Provider value={value}>
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
