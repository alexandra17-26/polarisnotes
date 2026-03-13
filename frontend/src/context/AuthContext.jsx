import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const STORAGE_KEY = 'polaris_notes_token';
const USER_KEY = 'polaris_notes_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(!!localStorage.getItem(STORAGE_KEY));

  const setToken = useCallback((newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem(STORAGE_KEY, newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    if (userData) localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, [setToken]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, [setToken]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {}
    }
    api.get('/api/auth/me')
      .then((res) => {
        if (res.data?.user) {
          const nextUser = res.data.user;
          setUser(nextUser);
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        }
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token, setToken]);

  // Clear session on 401 (e.g. expired token)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401 && token) {
          setToken(null);
          setUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [token, setToken]);

  const value = { user, token, loading, login, logout, setToken };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
