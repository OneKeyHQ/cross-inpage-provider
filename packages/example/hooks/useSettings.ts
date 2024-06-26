import { useState, useEffect, useCallback } from 'react';

interface Settings {
  autoConnect?: boolean;
}

const defaultSettings: Settings = {
  autoConnect: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadedSettings = localStorage.getItem('appSettings');
    if (loadedSettings) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      setSettings((prevSettings) => ({
        ...prevSettings,
        ...JSON.parse(loadedSettings),
      }));
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prevSettings) => {
      const newSettings = { ...prevSettings, [key]: value };
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
