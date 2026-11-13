import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';
import {
  STORAGE_KEYS,
  LEGACY_STORAGE_KEYS,
  getStoredValue,
} from '../constants/storageKeys';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await getStoredValue(
          STORAGE_KEYS.THEME_MODE,
          LEGACY_STORAGE_KEYS.THEME_MODE
        );
        if (active && savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      } finally {
        if (active) setThemeLoaded(true);
      }
    };
    loadSavedTheme();
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme,
        toggleTheme,
        themeLoaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
