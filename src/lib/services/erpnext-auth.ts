import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_ERPNEXT_API_URL;

interface AuthResponse {
  success: boolean;
  error?: string;
}

/**
 * Handles ERPNext authentication service errors
 */
const handleAuthError = (error: any, defaultMessage: string): AuthResponse => {
  console.error('ERPNext Auth Error:', error);
  const errorMessage = error.response?.data?.message || defaultMessage;
  toast({
    title: 'Authentication Error',
    description: errorMessage,
    variant: 'destructive'
  });
  return { success: false, error: errorMessage };
};

/**
 * Authenticates user with ERPNext
 */
export const loginWithERPNext = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await axios.post(
      `/api/method/login`,
      new URLSearchParams({ usr: username, pwd: password }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Assuming session ID is handled by the API proxy and cookies
    toast({
      title: 'Login Successful',
      description: 'Welcome back!'
    });

    return { success: true };
  } catch (error: any) {
    return handleAuthError(error, 'Login failed. Please try again.');
  }
};

/**
 * Logs out user from ERPNext
 */
export const logoutFromERPNext = async (): Promise<AuthResponse> => {
  try {
    await axios.get(`${API_URL}/api/method/logout`);
    localStorage.removeItem('erpnext_sid');
    
    toast({
      title: 'Logout Successful',
      description: 'You have been successfully logged out.'
    });

    return { success: true };
  } catch (error: any) {
    return handleAuthError(error, 'Logout failed. Please try again.');
  }
};

/**
 * Sends password reset request to ERPNext
 */
export const resetERPNextPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/method/frappe.core.doctype.user.user.reset_password`,
      new URLSearchParams({ user: email }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.status === 200) {
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for this email, a password reset link has been sent.'
      });
      return { success: true };
    }

    throw new Error('Password reset request failed');
  } catch (error: any) {
    return handleAuthError(error, 'Failed to send password reset email.');
  }
};