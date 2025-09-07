// src/hooks/useUserSession.ts

import { useState, useEffect } from 'react';

interface UserSession {
  token: string | null;
  user_type: string | null;
  username: string | null;
  isAuthenticated: boolean;
}

export function useUserSession() {
  // ✅ Read from localStorage at initialization
  const getInitialSession = (): UserSession => {
    const token = localStorage.getItem('token');
    const user_type = localStorage.getItem('user_type');
    const username = localStorage.getItem('username');

    return {
      token,
      user_type,
      username,
      isAuthenticated: !!token,
    };
  };

  const [session, setSession] = useState<UserSession>(getInitialSession);

  const updateSession = () => {
    const token = localStorage.getItem('token');
    const user_type = localStorage.getItem('user_type');
    const username = localStorage.getItem('username');

    setSession({
      token,
      user_type,
      username,
      isAuthenticated: !!token,
    });
  };

  // Load on mount (redundant now, but safe)
  useEffect(() => {
    // This is now optional, but keeps session in sync if localStorage changes before React mounts
    updateSession();
  }, []);

  // Listen for cross-tab changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (['token', 'user_type', 'username'].includes(e.key!)) {
        updateSession();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for same-tab session changes
  useEffect(() => {
    window.addEventListener('sessionchange', updateSession);
    return () => window.removeEventListener('sessionchange', updateSession);
  }, []);

  return session;
}