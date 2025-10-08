// src/hooks/useUserSession.ts

import { useState, useEffect } from 'react';

interface UserSession {
  token: string | null;
  user_type: string | null;
  username: string | null;
  user_plan: string | null;
  isAuthenticated: boolean;
}

export function useUserSession() {
  // Read from localStorage at initialization
  const getInitialSession = (): UserSession => {
    const token = localStorage.getItem('token');
    const user_type = localStorage.getItem('user_type');
    const username = localStorage.getItem('username');
    const user_plan = localStorage.getItem('plan_type'); 

    return {
      token,
      user_type,
      username,
      user_plan,
      isAuthenticated: !!token,
    };
  };

  const [session, setSession] = useState<UserSession>(getInitialSession);

  const updateSession = () => {
    const token = localStorage.getItem('token');
    const user_type = localStorage.getItem('user_type');
    const username = localStorage.getItem('username');
    const user_plan = localStorage.getItem('plan_type');

    setSession({
      token,
      user_type,
      username,
      user_plan,
      isAuthenticated: !!token,
    });
  };

  // Load on mount
  useEffect(() => {
    updateSession();
  }, []);

  // Listen for cross-tab localStorage changes (including plan_type)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (['token', 'user_type', 'username', 'plan_type'].includes(e.key!)) {
        updateSession();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for same-tab session changes (e.g., after login/upgrade)
  useEffect(() => {
    const handleSessionChange = () => {
      updateSession();
    };
    window.addEventListener('sessionchange', handleSessionChange);
    return () => window.removeEventListener('sessionchange', handleSessionChange);
  }, []);
 
  return session;
}