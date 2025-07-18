
'use client';

// This file now acts as a client-side wrapper for our Next.js API routes

interface AuthResponse {
  success: boolean;
  error?: string;
  sid?: string;
}

interface UserDetails {
  username: string;
  email: string;
  fullName: string;
  photoURL?: string | null;
}

interface UserDetailsResponse {
  success: boolean;
  user?: UserDetails;
  error?: string;
}


/**
 * Authenticates user with ERPNext via our API route
 */
export const loginWithERPNext = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/erpnext-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usr: username, pwd: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed. Please try again.' };
    }

    return { success: true, sid: data.sid };
  } catch (error: any) {
    console.error('ERPNext Login Service Error:', error);
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
};

/**
 * Logs out user from ERPNext via our API route
 */
export const logoutFromERPNext = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/erpnext-auth/logout', { method: 'POST' });
    
    if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error || 'Logout failed.' };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('ERPNext Logout Service Error:', error);
    return { success: false, error: 'An unexpected error occurred during logout.' };
  }
};

/**
 * Sends password reset request to ERPNext via our API route
 */
export const resetERPNextPassword = async (email: string): Promise<AuthResponse> => {
   try {
    const response = await fetch('/api/erpnext-auth/reset-password', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    });

     const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Password reset request failed.'};
    }

    return { success: true };
  } catch (error: any) {
     console.error('ERPNext Password Reset Service Error:', error);
    return { success: false, error: 'An unexpected error occurred during password reset.' };
  }
};


/**
 * Gets the current user's details from our API route
 */
export const getUserDetailsFromERPNext = async (): Promise<UserDetailsResponse> => {
  try {
    const response = await fetch('/api/erpnext-auth/get-user-details');
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Could not fetch user session.' };
    }
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Get User Details Service Error:', error);
    return { success: false, error: 'Failed to connect to server to check session.' };
  }
}
