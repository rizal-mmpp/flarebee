'use server';

import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { randomUUID } from 'crypto';

const SERVICE_AUTH_TOKENS_COLLECTION = 'serviceAuthTokens';

/**
 * Generates a short-lived token for a user to authenticate with a service.
 * @param userId - The UID of the user to generate a token for.
 * @returns An object with the success status and the token if successful.
 */
export async function generateServiceAuthToken(
  userId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }

  try {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Token expires in 5 minutes

    const tokenRef = doc(db, SERVICE_AUTH_TOKENS_COLLECTION, token);

    await setDoc(tokenRef, {
      userId: userId,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    console.log(`Generated auth token for user ${userId}`);
    return { success: true, token: token };
  } catch (error: any) {
    console.error('Error generating service auth token:', error);
    return {
      success: false,
      error: 'Could not generate authentication token.',
    };
  }
}
