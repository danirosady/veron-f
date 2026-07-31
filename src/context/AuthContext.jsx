import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          const profileRes = await authAPI.getProfile();
          const userData = profileRes.data?.data || profileRes.data;
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_refresh_token');
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authAPI.login({ email, password });
    const payload = response.data?.data || response.data;
    const accessToken = payload.access_token || payload.token;
    const refreshToken = payload.refresh_token;
    const userData = payload.user || payload;

    if (accessToken) {
      localStorage.setItem('auth_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('auth_refresh_token', refreshToken);
    }
    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }

    setToken(accessToken);
    setUser(userData);

    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      authAPI.logout();
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_refresh_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }
  }, []);

  const changePassword = useCallback(async (data) => {
    const response = await authAPI.changePassword(data);
    return response;
  }, []);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}