import { useState, useEffect, useRef, useCallback } from 'react';
import { useServer } from '../context/ServerContext';

export function useServerData(moduleName, { poll = false, interval = 1000 } = {}) {
  const { fetchOnce, startPolling, stopPolling } = useServer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const handleData = useCallback((response) => {
    if (!mountedRef.current) return;
    setData(response);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);

    if (poll) {
      startPolling(moduleName, handleData, interval);
    } else {
      fetchOnce(moduleName, handleData);
    }

    return () => {
      mountedRef.current = false;
      if (poll) stopPolling(moduleName);
    };
  }, [moduleName, poll, interval]);

  return { data, loading, error };
}
