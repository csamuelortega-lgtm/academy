import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'git-academy-auth';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const AuthContext = createContext(null);

const readStoredSession = () => {
  try {
    const rawSession = window.localStorage.getItem(STORAGE_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
};

const persistSession = (session) => {
  if (!window.localStorage) {
    return;
  }

  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

const requestJson = async (path, options = {}, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    const message = payload?.message || payload?.error || payload || 'No se pudo completar la operación';
    throw new Error(message);
  }

  return payload;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSession = readStoredSession();

    if (!storedSession?.token) {
      setLoading(false);
      return;
    }

    requestJson('/api/auth/me', { method: 'GET' }, storedSession.token)
      .then((data) => {
        const nextSession = {
          token: storedSession.token,
          user: data.user,
        };

        setSession(nextSession);
        persistSession(nextSession);
      })
      .catch(() => {
        setSession(null);
        persistSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async ({ identifier, password }) => {
    const data = await requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    const nextSession = {
      token: data.token,
      user: data.user,
    };

    setSession(nextSession);
    persistSession(nextSession);

    return data.user;
  };

  const logout = async () => {
    try {
      if (session?.token) {
        await requestJson('/api/auth/logout', { method: 'POST' }, session.token);
      }
    } catch {
      // La sesión se limpia igualmente en el cliente.
    }

    setSession(null);
    persistSession(null);
  };

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.token),
    loading,
    login,
    logout,
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
