import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getMeRequest, loginRequest, registerRequest } from '../services/auth.service';

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('jwt'));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('jwt')) && !readStoredUser());

  const persistSession = useCallback((session) => {
    localStorage.setItem('jwt', session.token);
    localStorage.setItem('user', JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const session = await loginRequest(credentials);
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload) => {
      const session = await registerRequest(payload);
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!token || user) {
      setLoading(false);
      return undefined;
    }

    getMeRequest()
      .then(({ user: currentUser }) => {
        if (!alive) return;
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        if (alive) logout();
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [logout, token, user]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [loading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
