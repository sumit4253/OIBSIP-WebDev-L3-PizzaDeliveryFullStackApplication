import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser  = localStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken');

        if (!storedUser || !storedToken) {
          // No stored credentials — not logged in
          setLoading(false);
          return;
        }

        // Set user immediately from localStorage (no waiting)
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Then verify in background
        try {
          const res = await authService.getProfile();
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } catch (err) {
          // Profile fetch failed — try refresh token first
          try {
            const refreshRes = await authService.refreshToken();
            if (refreshRes?.data?.accessToken) {
              localStorage.setItem('accessToken', refreshRes.data.accessToken);
              // Try profile again
              const res2 = await authService.getProfile();
              setUser(res2.data.user);
              localStorage.setItem('user', JSON.stringify(res2.data.user));
            } else {
              throw new Error('Refresh failed');
            }
          } catch (refreshErr) {
            // All failed — clear auth
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        // JSON parse error or other — clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // ALWAYS set loading false no matter what
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false); // ← also set here
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearAuth();
  }, [clearAuth]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};