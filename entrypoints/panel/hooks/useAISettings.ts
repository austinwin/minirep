import { useState, useEffect } from 'react';
import { browser } from '#imports';
import { AISettings, AIProvider } from '../types/ai';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  viewMode: 'sidebar'
};

const STORAGE_KEY = 'aiSettings';

const readLocalStorageJSON = <T,>(key: string): T | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeLocalStorageJSON = (key: string, value: unknown) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures (quota, privacy mode, etc.)
  }
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      try {
        let stored: AISettings | null = null;
        if (typeof browser !== 'undefined' && browser.storage?.local) {
          const res = await browser.storage.local.get(STORAGE_KEY);
          if (res && res[STORAGE_KEY]) {
            stored = res[STORAGE_KEY] as AISettings;
          }
        }
        if (!stored) {
          stored = readLocalStorageJSON<AISettings>(STORAGE_KEY);
        }
        if (!cancelled) {
          setSettings({ ...DEFAULT_SETTINGS, ...(stored || {}) });
        }
      } catch (err) {
        console.error('Failed to load AI settings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = async (newSettings: AISettings) => {
    const nextSettings = { ...DEFAULT_SETTINGS, ...newSettings };
    setSettings(nextSettings);
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      try {
        await browser.storage.local.set({ [STORAGE_KEY]: nextSettings });
      } catch (err) {
        console.warn('Failed to persist AI settings to extension storage:', err);
      }
    }
    writeLocalStorageJSON(STORAGE_KEY, nextSettings);
  };

  return { settings, updateSettings, loading };
}
