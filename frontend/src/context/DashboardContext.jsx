import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DashboardContext = createContext(null);

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function DashboardProvider({ children }) {
  const [activeTab, setActiveTab] = useState(() =>
    localStorage.getItem('currentTab')?.replace('/', '') || 'system-status'
  );
  const [hiddenPlugins, setHiddenPlugins] = useState(() =>
    loadFromStorage('hiddenPlugins', [])
  );
  const [pluginOrder, setPluginOrder] = useState(() =>
    loadFromStorage('pluginOrder', {})
  );

  useEffect(() => {
    localStorage.setItem('currentTab', '/' + activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveToStorage('hiddenPlugins', hiddenPlugins);
  }, [hiddenPlugins]);

  useEffect(() => {
    saveToStorage('pluginOrder', pluginOrder);
  }, [pluginOrder]);

  const togglePlugin = useCallback((moduleName) => {
    setHiddenPlugins((prev) => {
      if (prev.includes(moduleName)) {
        return prev.filter((n) => n !== moduleName);
      }
      return [...prev, moduleName];
    });
  }, []);

  const isPluginHidden = useCallback((moduleName) => {
    return hiddenPlugins.includes(moduleName);
  }, [hiddenPlugins]);

  const setOrder = useCallback((tab, ids) => {
    setPluginOrder((prev) => ({ ...prev, [tab]: ids }));
  }, []);

  const getOrder = useCallback((tab) => {
    return pluginOrder[tab] || null;
  }, [pluginOrder]);

  return (
    <DashboardContext.Provider value={{
      activeTab, setActiveTab,
      hiddenPlugins, togglePlugin, isPluginHidden,
      setOrder, getOrder,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
