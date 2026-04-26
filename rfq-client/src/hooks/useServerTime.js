import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

let serverSkew = 0;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(serverSkew));
};

export const refreshServerSkew = async () => {
  try {
    const { data } = await api.get('/auth/time');
    const serverTime = Number(data.serverTime);
    if (Number.isFinite(serverTime)) {
      serverSkew = serverTime - Date.now();
      notify();
    }
  } catch {
    serverSkew = 0;
    notify();
  }
  return serverSkew;
};

export const getServerSkew = () => serverSkew;

export const useServerTime = () => {
  const [skew, setSkew] = useState(serverSkew);

  useEffect(() => {
    listeners.add(setSkew);
    refreshServerSkew();
    return () => {
      listeners.delete(setSkew);
    };
  }, []);

  const refresh = useCallback(() => refreshServerSkew(), []);

  return { skew, refresh };
};
