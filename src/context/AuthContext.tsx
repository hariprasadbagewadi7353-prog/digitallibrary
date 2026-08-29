import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gov_lib_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('gov_lib_token');
            setToken(null);
            setUser(null);
          }
        } catch {
          // If response was not valid JSON
          localStorage.removeItem('gov_lib_token');
          setToken(null);
          setUser(null);
        }
      } else {
        localStorage.removeItem('gov_lib_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      localStorage.removeItem('gov_lib_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string, rememberMe = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        return {
          success: false,
          error: `Server communication error (${res.status}). Please check system connectivity and retry.`
        };
      }

      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials provided.' };
      }
      
      if (data.token) {
        if (rememberMe) {
          localStorage.setItem('gov_lib_token', data.token);
        }
        setToken(data.token);
      }
      
      if (data.user) {
        setUser(data.user);
      }
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to authentication server.' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('gov_lib_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
