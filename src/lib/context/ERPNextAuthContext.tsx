
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
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

  const checkSession = useCallback(async () => {
    setLoading(true);
    const sessionId = localStorage.getItem('erpnext_sid');
    if (sessionId) {
      try {
        const getHeaders = (sid: string) => ({ Cookie: `sid=${sid}` });

        const loggedUserResponse = await fetch(`${process.env.NEXT_PUBLIC_ERPNEXT_API_URL}/api/method/frappe.auth.get_logged_user`, { headers: getHeaders(sessionId) });

        if (!loggedUserResponse.ok || loggedUserResponse.status === 401) { throw new Error('Not logged in'); }
        
        const loggedUserData = await loggedUserResponse.json();
        const userId = loggedUserData.message;
        if (!userId || userId === 'Guest') { throw new Error('Guest user'); }

        const fields = ['email', 'full_name'];
        const filters = [[`name`, `=`, userId]];
        const userUrl = `${process.env.NEXT_PUBLIC_ERPNEXT_API_URL}/api/resource/User?fields=${encodeURIComponent(JSON.stringify(fields))}&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        const userResponse = await fetch(userUrl, { headers: getHeaders(sessionId) });
        if (!userResponse.ok) { throw new Error('Failed to get user data'); }

        const userResponseData = await userResponse.json();
        const userData = userResponseData.data[0];

        setUser({
          username: userId,
          email: userData.email || '',
          fullName: userData.full_name || ''
        });
      } catch (error) {
        setUser(null);
        localStorage.removeItem('erpnext_sid');
      } finally {
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await loginWithERPNext(username, password);
      if (result.success) {
        await checkSession(); // Re-check session to get user details
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
