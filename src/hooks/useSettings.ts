import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '../components/SettingsDialog';

const SETTINGS_KEY = 'ourHairitage_settings';

const defaultSettings: UserSettings = {
  theme: 'dark',
  fontSize: 'medium',
  messageStyle: 'bubbles',
  showTimestamps: true,
  soundEnabled: false,
  exportFormat: 'json'
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (settings.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
        root.classList.toggle('light', !prefersDark);
      } else {
        root.classList.toggle('dark', settings.theme === 'dark');
        root.classList.toggle('light', settings.theme === 'light');
      }

      // Apply font size
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      root.style.setProperty('--font-size-base', fontSizeMap[settings.fontSize]);
    };

    applyTheme();

    // Listen for system theme changes if using auto theme
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme, settings.fontSize]);

  const updateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_KEY);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings
  };
}
