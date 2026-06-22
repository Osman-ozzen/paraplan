import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Token'ı localStorage'da sakla
const TOKEN_KEY = 'paraplan_token';
const USER_KEY = 'paraplan_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Sayfa yüklenince oturumu geri yükle
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setYukleniyor(false);
  }, []);

  // API isteklerine token ekle
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    return res.json();
  }, [token]);

  // Kayıt ol
  const register = useCallback(async (email, password) => {
    const raw = await authFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Yeni format: { basarili, veri: { user, session } } — eski: { user, session }
    const data = raw.veri || raw;
    if (data.session) {
      setToken(data.session.access_token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.session.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return raw;
  }, [authFetch]);

  // Giriş yap
  const login = useCallback(async (email, password) => {
    const raw = await authFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Yeni format: { basarili, veri: { user, session } } — eski: { user, session }
    const data = raw.veri || raw;
    if (data.session) {
      setToken(data.session.access_token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.session.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return raw;
  }, [authFetch]);

  // Çıkış yap
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, yukleniyor, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
