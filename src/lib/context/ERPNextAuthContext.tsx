
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { loginWithERPNext, logoutFromERPNext, resetERPNextPassword } from '@/lib/services/erpnext-auth';
import { useToast } from '@/hooks/use-toast';

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
  checkSession: () => Promise<void>;
}

const ERPNextAuthContext = createContext<ERPNextAuthContextType | undefined>(undefined);

export function ERPNextAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ERPNextUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSession = useCallback(async () => {
    setLoading(true);
    const sessionId = localStorage.getItem('erpnext_sid');
    if (sessionId) {
      try {
        const getHeaders = (sid: string) => ({ Cookie: `sid=${sid}` });

        const loggedUserResponse = await fetch(`/api/erpnext-auth/get-logged-user`);

        if (!loggedUserResponse.ok || loggedUserResponse.status === 401) { throw new Error('Not logged in'); }
        
        const loggedUserData = await loggedUserResponse.json();
        const userId = loggedUserData.message;
        if (!userId || userId === 'Guest') { throw new Error('Guest user'); }

        const userUrl = `/api/erpnext-auth/get-user-details?userId=${encodeURIComponent(userId)}`;
        const userResponse = await fetch(userUrl);
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
        toast({
            title: 'Login Successful',
            description: 'Welcome back!'
        });
      } else if (result.error) {
         toast({
            title: 'Authentication Error',
            description: result.error,
            variant: 'destructive'
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
        toast({
            title: 'Logout Successful',
            description: 'You have been successfully logged out.'
        });
      } else if (result.error) {
          toast({
            title: 'Logout Failed',
            description: result.error,
            variant: 'destructive'
        });
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const result = await resetERPNextPassword(email);
       if (result.success) {
        toast({
            title: 'Password Reset Email Sent',
            description: 'If an account exists for this email, a password reset link has been sent.'
        });
      } else if (result.error) {
         toast({
            title: 'Failed to send password reset email.',
            description: result.error,
            variant: 'destructive'
        });
      }
      return result;
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
    checkSession,
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
