import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { fetchModule, useWebSocket, hasWebSocket, initWebSocket } from '../services/dataService';

const ServerContext = createContext(null);

export function ServerProvider({ children }) {
  const [wsReady, setWsReady] = useState(false);
  const pollingRefs = useRef({});
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const ready = hasWebSocket();
    if (ready) {
      setWsReady(true);
    } else {
      initWebSocket();
      const checkInterval = setInterval(() => {
        if (hasWebSocket()) {
          setWsReady(true);
          clearInterval(checkInterval);
        }
      }, 500);
      setTimeout(() => clearInterval(checkInterval), 10000);
      return () => clearInterval(checkInterval);
    }
  }, []);

  const getData = useCallback((moduleName, callback) => {
    if (hasWebSocket()) {
      useWebSocket(moduleName, callback);
    } else {
      fetchModule(moduleName).then(callback);
    }
  }, []);

  const startPolling = useCallback((moduleName, callback, intervalMs = 1000) => {
    if (pollingRefs.current[moduleName]) return;
    const fetch = () => getData(moduleName, callback);
    fetch();
    pollingRefs.current[moduleName] = setInterval(fetch, intervalMs);
  }, [getData]);

  const stopPolling = useCallback((moduleName) => {
    if (pollingRefs.current[moduleName]) {
      clearInterval(pollingRefs.current[moduleName]);
      delete pollingRefs.current[moduleName];
    }
  }, []);

  const fetchOnce = useCallback((moduleName, callback) => {
    getData(moduleName, callback);
  }, [getData]);

  return (
    <ServerContext.Provider value={{ wsReady, getData, startPolling, stopPolling, fetchOnce }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServer must be used within ServerProvider');
  return ctx;
}
