
'use client';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '@/lib/types';

// displayNameParam is added to allow passing displayName from email/password signup
export async function createUserProfile(user: FirebaseUser, displayNameParam?: string | null): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { uid, email, photoURL } = user;
    // Use displayNameParam if provided, otherwise fallback to user.displayName (e.g., from Google)
    const resolvedDisplayName = displayNameParam || user.displayName; 

    const newUserProfile: UserProfile = {
      uid,
      email,
      displayName: resolvedDisplayName,
      photoURL: photoURL || null,
      role: 'user', 
      createdAt: new Date(), 
    };
    try {
      await setDoc(userRef, {
        ...newUserProfile,
        createdAt: serverTimestamp(), 
      });
      return { ...newUserProfile, createdAt: new Date() }; 
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }
  const existingProfileData = userSnap.data();
  const existingProfile: UserProfile = {
    uid: existingProfileData.uid,
    email: existingProfileData.email,
    displayName: existingProfileData.displayName,
    photoURL: existingProfileData.photoURL,
    role: existingProfileData.role || 'user',
    createdAt: (existingProfileData.createdAt as Timestamp).toDate(),
  };
  
  // If displayNameParam is provided and different from existing, update it.
  // This could happen if a user signs up, then logs in with Google, and Google's name is preferred later.
  // Or if user info was partially created.
  if (displayNameParam && displayNameParam !== existingProfile.displayName) {
    try {
      await setDoc(userRef, { displayName: displayNameParam }, { merge: true });
      existingProfile.displayName = displayNameParam;
    } catch (error) {
      console.error('Error updating displayName during profile creation check:', error);
    }
  }
  
  return existingProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as Omit<UserProfile, 'createdAt'> & { createdAt: Timestamp };
    return {
      ...userData,
      role: userData.role || 'user', // Ensure role defaults to 'user' if missing
      createdAt: userData.createdAt.toDate(),
    };
  }
  return null;
}
