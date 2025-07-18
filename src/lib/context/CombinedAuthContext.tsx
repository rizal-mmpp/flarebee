
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { AuthProvider as FirebaseAuthProvider, useAuth as useFirebaseAuth } from '@/lib/firebase/AuthContext';
import { useERPNextAuth, ERPNextAuthProvider } from '@/lib/context/ERPNextAuthContext';

type AuthMethod = 'firebase' | 'erpnext';

interface CombinedAuthContextType {
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const CombinedAuthContext = createContext<CombinedAuthContextType | undefined>(undefined);

export function CombinedAuthProvider({ children }: { children: ReactNode }) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('erpnext');

  return (
    <FirebaseAuthProvider>
      <ERPNextAuthProvider>
        <CombinedAuthContent authMethod={authMethod} setAuthMethod={setAuthMethod}>
          {children}
        </CombinedAuthContent>
      </ERPNextAuthProvider>
    </FirebaseAuthProvider>
  );
}

function CombinedAuthContent({
  children,
  authMethod,
  setAuthMethod,
}: {
  children: ReactNode;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
}) {
  const firebase = useFirebaseAuth();
  const erpnext = useERPNextAuth();

  const [combinedLoading, setCombinedLoading] = useState(true);

  // Unify authentication status
  const isAuthenticated = authMethod === 'firebase' ? !!firebase.user : !!erpnext.user;

  // Effect to determine initial auth state on load
  useEffect(() => {
    setCombinedLoading(true);
    // The individual contexts handle their own loading. We just need to wait for them.
    if (!firebase.loading && !erpnext.loading) {
      if (erpnext.user) {
        setAuthMethod('erpnext');
      } else if (firebase.user) {
        setAuthMethod('firebase');
      }
      setCombinedLoading(false);
    }
  }, [firebase.user, firebase.loading, erpnext.user, erpnext.loading, setAuthMethod]);


  const signIn = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    let result;
    if (authMethod === 'firebase') {
      result = await firebase.signInWithEmailPassword(username, password);
    } else {
      result = await erpnext.signIn(username, password);
      if (result.success) {
        // Trigger a session check to update user details after successful ERPNext login
        await erpnext.checkSession();
      }
    }
    return result;
  }, [authMethod, firebase, erpnext]);

  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (authMethod === 'firebase') {
      await firebase.signOutUser();
    } else {
      await erpnext.signOut();
    }
    // Always reset to a default auth method after sign out
    setAuthMethod('erpnext');
    return { success: true };
  }, [authMethod, firebase, erpnext, setAuthMethod]);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    return authMethod === 'firebase'
      ? firebase.sendPasswordReset(email)
      : erpnext.resetPassword(email);
  }, [authMethod, firebase, erpnext]);

  const value = {
    authMethod,
    setAuthMethod,
    isAuthenticated,
    loading: combinedLoading, // Use the combined loading state
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <CombinedAuthContext.Provider value={value}>
      {children}
    </CombinedAuthContext.Provider>
  );
}

export function useCombinedAuth() {
  const context = useContext(CombinedAuthContext);
  if (context === undefined) {
    throw new Error('useCombinedAuth must be used within a CombinedAuthProvider');
  }
  return context;
}
