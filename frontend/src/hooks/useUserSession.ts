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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user_type = localStorage.getItem('user_type');
    const username = localStorage.getItem('username');

    setSession({
      token,
      user_type,
      username,
      isAuthenticated: !!token,
    });
  }, []);

  return session;
}