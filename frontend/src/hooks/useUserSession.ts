// src/hooks/useUserSession.ts
import { useState, useEffect } from 'react';

interface UserSession {
  token: string | null;
  user_type: string | null;
  username: string | null;
  isAuthenticated: boolean;
}

export function useUserSession() {
  const [session, setSession] = useState<UserSession>({
    token: null,
    user_type: null,
    username: null,
    isAuthenticated: false,
  });

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

  // Load on mount
  useEffect(() => {
    updateSession();
  }, []);

  // Listen for localStorage changes (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user_type' || e.key === 'username') {
        updateSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen for custom sessionchange event (same-tab)
  useEffect(() => {
    const handleSessionChange = () => {
      updateSession();
    };

    window.addEventListener('sessionchange', handleSessionChange);

    return () => {
      window.removeEventListener('sessionchange', handleSessionChange);
    };
  }, []);

  return session;
}