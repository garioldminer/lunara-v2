import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  AppSettings, 
  getSettings, 
  updateSetting, 
  applyTheme,
  initializeSettings 
} from '../lib/settingsService';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  // ✅ Initialize on mount
  useEffect(() => {
    const initialized = initializeSettings();
    setSettings(initialized);
  }, []);

  // ✅ Listen for system theme changes (auto mode)
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('auto');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const handleUpdateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const updated = updateSetting(key, value);
    setSettings(updated);
  };

  const handleResetSettings = () => {
    localStorage.removeItem('lunara_settings');
    const defaults = initializeSettings();
    setSettings(defaults);
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        updateSetting: handleUpdateSetting,
        resetSettings: handleResetSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}