
'use client';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '@/lib/types';

export async function createUserProfile(user: FirebaseUser): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { uid, email, displayName, photoURL } = user;
    const newUserProfile: UserProfile = {
      uid,
      email,
      displayName,
      photoURL: photoURL || null,
      role: 'user', // Default role
      createdAt: new Date(), // Will be converted by Firestore
    };
    try {
      await setDoc(userRef, {
        ...newUserProfile,
        createdAt: serverTimestamp(), // Use server timestamp for consistency
      });
      return { ...newUserProfile, createdAt: new Date() }; // Return with client-side date for immediate use
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }
  // If user already exists, cast and return
  const existingProfile = userSnap.data() as Omit<UserProfile, 'createdAt'> & { createdAt: Timestamp };
  return {
    ...existingProfile,
    createdAt: existingProfile.createdAt.toDate(),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as Omit<UserProfile, 'createdAt'> & { createdAt: Timestamp };
    return {
      ...userData,
      createdAt: userData.createdAt.toDate(),
    };
  }
  return null;
}
