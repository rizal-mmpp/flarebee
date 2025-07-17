'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginWithERPNext, logoutFromERPNext, resetERPNextPassword } from '@/lib/services/erpnext-auth';

interface ERPNextUser {
  username: string;
  email: string;
  fullName: string;
}

interface ERPNextAuthContextType {
  user: ERPNextUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const ERPNextAuthContext = createContext<ERPNextAuthContextType | undefined>(undefined);

export function ERPNextAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ERPNextUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const sessionId = localStorage.getItem('erpnext_sid');
      if (sessionId) {
        // TODO: Implement session validation with ERPNext
        // For now, we'll just assume the session is valid if it exists
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await loginWithERPNext(username, password);
      if (result.success) {
        // TODO: Fetch user details from ERPNext
        setUser({
          username,
          email: username, // Assuming username is email
          fullName: '', // TODO: Get from ERPNext
        });
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await logoutFromERPNext();
      if (result.success) {
        setUser(null);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      return await resetERPNextPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <ERPNextAuthContext.Provider value={value}>
      {children}
    </ERPNextAuthContext.Provider>
  );
}

export function useERPNextAuth() {
  const context = useContext(ERPNextAuthContext);
  if (context === undefined) {
    throw new Error('useERPNextAuth must be used within an ERPNextAuthProvider');
  }
  return context;
}