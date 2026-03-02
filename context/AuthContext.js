'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/services/api';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const initAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('medigence_token');
      const storedUser = localStorage.getItem('medigence_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify token is still valid
        const res = await authAPI.getMe();
        const freshUser = res.data.data.user;
        setUser(freshUser);
        localStorage.setItem('medigence_user', JSON.stringify(freshUser));
        connectSocket(storedToken);
      }
    } catch {
      // Token invalid – clear storage
      localStorage.removeItem('medigence_token');
      localStorage.removeItem('medigence_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    const { user: userData, token: jwt } = res.data.data;
    localStorage.setItem('medigence_token', jwt);
    localStorage.setItem('medigence_user', JSON.stringify(userData));
    document.cookie = `medigence_token=${jwt}; path=/; max-age=86400; SameSite=Lax`;
    setToken(jwt);
    setUser(userData);
    connectSocket(jwt);
    return userData;
  }, []);

  const signup = useCallback(async (credentials) => {
    const res = await authAPI.signup(credentials);
    const { user: userData, token: jwt } = res.data.data;
    localStorage.setItem('medigence_token', jwt);
    localStorage.setItem('medigence_user', JSON.stringify(userData));
    document.cookie = `medigence_token=${jwt}; path=/; max-age=86400; SameSite=Lax`;
    setToken(jwt);
    setUser(userData);
    connectSocket(jwt);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('medigence_token');
    localStorage.removeItem('medigence_user');
    document.cookie = 'medigence_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setToken(null);
    setUser(null);
    disconnectSocket();
    router.push('/login');
  }, [router]);

  const value = {
    user,
    token,
    loading,
    role: user?.role,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
